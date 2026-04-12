#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import PDFKitDocument from "pdfkit";
import SVGtoPDF from "svg-to-pdfkit";

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const outputDirArg = process.argv[3] ?? "diagrams/out/pdf";
const mergedPdfArg = process.argv[4] ?? "diagrams/out/diagram-book.pdf";

const rootDir = process.cwd();
const manifestPath = path.resolve(rootDir, manifestArg);
const outputDir = path.resolve(rootDir, outputDirArg);
const outputSvgDir = path.resolve(rootDir, "diagrams/out/svg");
const mergedPdfPath = path.resolve(rootDir, mergedPdfArg);
const reportPath = path.resolve(rootDir, "diagrams/out/diagram-build-report.json");
const lockFilePath = path.resolve(rootDir, "diagrams/diagram-lock.json");
const pdfProfilesPath = path.resolve(rootDir, "diagrams/pdf-profiles.json");
const renderWidth = Number.parseInt(process.env.MERMAID_RENDER_WIDTH ?? "5600", 10);
const renderHeight = Number.parseInt(process.env.MERMAID_RENDER_HEIGHT ?? "4200", 10);
const MAX_PAGE_SIZE_PT = 14400;
const MIN_PAGE_SIZE_PT = 300;
const unlockRequested = /^(1|true|yes)$/i.test(process.env.DIAGRAMS_UNLOCK ?? "");

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

function runCommand(command, args) {
    const result = spawnSync(command, args, {
        cwd: rootDir,
        stdio: "inherit"
    });
    if (result.error) {
        return { ok: false, error: result.error.message, status: -1 };
    }
    return { ok: result.status === 0, status: result.status ?? -1 };
}

function loadJsonIfExists(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }

    try {
        return JSON.parse(readFileSync(filePath, "utf8"));
    } catch (error) {
        fail(`Failed to parse JSON at '${path.relative(rootDir, filePath)}': ${error.message}`);
    }
}

function fileSha256(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }

    const digest = createHash("sha256");
    digest.update(readFileSync(filePath));
    return digest.digest("hex");
}

function assertLockedHashes(hashMap, label) {
    if (!hashMap || typeof hashMap !== "object") {
        return;
    }

    for (const [relativePath, expectedHash] of Object.entries(hashMap)) {
        const absolutePath = path.resolve(rootDir, relativePath);
        const actualHash = fileSha256(absolutePath);

        if (!actualHash) {
            fail(`Locked ${label} missing: '${relativePath}'. Run with DIAGRAMS_UNLOCK=1 to refresh artifacts.`);
        }

        if (actualHash !== expectedHash) {
            fail(
                `Locked ${label} changed: '${relativePath}'. Use DIAGRAMS_UNLOCK=1 for approved updates, then refresh lock file.`
            );
        }
    }
}

function resolveMermaidCli() {
    const envBin = process.env.MERMAID_CLI_BIN;

    if (envBin && existsSync(envBin)) {
        const probe = spawnSync(envBin, ["--version"], { cwd: rootDir, stdio: "ignore" });
        if (!probe.error) {
            return { command: envBin, argsPrefix: [] };
        }
    }

    const localCli = path.resolve(rootDir, "node_modules/.bin/mmdc");
    if (existsSync(localCli)) {
        const probe = spawnSync(localCli, ["--version"], { cwd: rootDir, stdio: "ignore" });
        if (!probe.error) {
            return { command: localCli, argsPrefix: [] };
        }
    }

    const npxProbe = spawnSync("npx", ["mmdc", "--version"], { cwd: rootDir, stdio: "ignore" });
    if (!npxProbe.error && npxProbe.status === 0) {
        return { command: "npx", argsPrefix: ["mmdc"] };
    }

    fail(
        "No Mermaid CLI found. Install dependencies with npm install or set MERMAID_CLI_BIN to an mmdc binary path."
    );
}

function exportDiagramSvg(cli, sourcePath, outputSvgPath) {
    const configPath = path.resolve(rootDir, "diagrams/mermaid-config.json");
    const args = [
        ...cli.argsPrefix,
        "-i",
        sourcePath,
        "-o",
        outputSvgPath,
        "-e",
        "svg",
        "--width",
        String(Number.isFinite(renderWidth) ? renderWidth : 5600),
        "--height",
        String(Number.isFinite(renderHeight) ? renderHeight : 4200),
        "--scale",
        "1.2"
    ];

    if (existsSync(configPath)) {
        args.push("--configFile", configPath);
    }

    const render = runCommand(cli.command, args);
    if (render.ok && existsSync(outputSvgPath)) {
        return;
    }

    fail(`Failed to export SVG for '${sourcePath}'.`);
}

function exportDiagramPdfNative(cli, sourcePath, outputPdfPath, profile) {
    const configPath = path.resolve(rootDir, "diagrams/mermaid-config.json");
    const args = [
        ...cli.argsPrefix,
        "-i",
        sourcePath,
        "-o",
        outputPdfPath,
        "-e",
        "pdf"
    ];

    if (Number.isFinite(profile?.nativeWidth) && profile.nativeWidth > 0) {
        args.push("--width", String(profile.nativeWidth));
    } else {
        args.push("--width", String(Number.isFinite(renderWidth) ? renderWidth : 5600));
    }

    if (Number.isFinite(profile?.nativeHeight) && profile.nativeHeight > 0) {
        args.push("--height", String(profile.nativeHeight));
    } else {
        args.push("--height", String(Number.isFinite(renderHeight) ? renderHeight : 4200));
    }

    if (Number.isFinite(profile?.nativeScale) && profile.nativeScale > 0) {
        args.push("--scale", String(profile.nativeScale));
    } else {
        args.push("--scale", "1.2");
    }

    if (profile?.nativePdfFit !== false) {
        args.push("--pdfFit");
    }

    if (existsSync(configPath)) {
        args.push("--configFile", configPath);
    }

    const render = runCommand(cli.command, args);
    if (render.ok && existsSync(outputPdfPath)) {
        return;
    }

    fail(`Failed to export native PDF for '${sourcePath}'.`);
}

function parseLength(rawValue) {
    if (typeof rawValue !== "string") {
        return Number.NaN;
    }

    if (rawValue.includes("%")) {
        return Number.NaN;
    }

    const match = rawValue.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
        return Number.NaN;
    }

    return Number.parseFloat(match[0]);
}

function resolvePdfProfile(config, entry) {
    const defaults = {
        engine: "svg-pdfkit",
        pageMode: "native",
        marginsPt: 0,
        minPageWidthPt: MIN_PAGE_SIZE_PT,
        minPageHeightPt: MIN_PAGE_SIZE_PT,
        maxPageWidthPt: MAX_PAGE_SIZE_PT,
        maxPageHeightPt: MAX_PAGE_SIZE_PT,
        preserveAspectRatio: "xMinYMin meet",
        alignX: "left",
        alignY: "top",
        forceSequenceLifelineToBottom: true
    };

    const byType = config?.byType?.[entry.type] ?? {};
    const byId = config?.byId?.[entry.id] ?? {};

    return {
        ...defaults,
        ...(config?.default ?? {}),
        ...byType,
        ...byId
    };
}

function fitInside(sourceWidth, sourceHeight, boxWidth, boxHeight) {
    if (sourceWidth <= 0 || sourceHeight <= 0 || boxWidth <= 0 || boxHeight <= 0) {
        return {
            width: Math.max(1, boxWidth),
            height: Math.max(1, boxHeight)
        };
    }

    const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
    return {
        width: sourceWidth * scale,
        height: sourceHeight * scale
    };
}

function normalizeSequenceLifelines(svgContent) {
    const heightMatch = svgContent.match(/\bheight="([^"]+)"/i);
    const svgHeight = parseLength(heightMatch?.[1] ?? "");

    if (!Number.isFinite(svgHeight) || svgHeight <= 0) {
        return { updatedContent: svgContent, changed: false };
    }

    const targetY2 = Math.round(Math.max(svgHeight - 20, 2000));
    let changed = false;

    const updatedContent = svgContent.replace(/<line\b[^>]*\bdata-et="life-line"[^>]*>/gi, (lineTag) => {
        const y2Match = lineTag.match(/\by2="([^"]+)"/i);
        if (!y2Match) {
            return lineTag;
        }

        const currentY2 = parseLength(y2Match[1]);
        if (Number.isFinite(currentY2) && currentY2 >= targetY2) {
            return lineTag;
        }

        changed = true;
        return lineTag.replace(/\by2="[^"]*"/i, `y2="${targetY2}"`);
    });

    return { updatedContent, changed };
}

function parseSvgDimensions(svgContent) {
    const widthMatch = svgContent.match(/\bwidth="([^"]+)"/i);
    const heightMatch = svgContent.match(/\bheight="([^"]+)"/i);
    const viewBoxMatch = svgContent.match(/\bviewBox="([^"]+)"/i);

    let width = parseLength(widthMatch?.[1] ?? "");
    let height = parseLength(heightMatch?.[1] ?? "");

    if ((!Number.isFinite(width) || !Number.isFinite(height)) && viewBoxMatch?.[1]) {
        const parts = viewBoxMatch[1]
            .trim()
            .split(/\s+/)
            .map((part) => Number.parseFloat(part));

        if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
            width = parts[2];
            height = parts[3];
        }
    }

    if (!Number.isFinite(width) || width <= 0) {
        width = Number.isFinite(renderWidth) ? renderWidth : 5600;
    }

    if (!Number.isFinite(height) || height <= 0) {
        height = Number.isFinite(renderHeight) ? renderHeight : 4200;
    }

    const scaleDown = Math.min(MAX_PAGE_SIZE_PT / width, MAX_PAGE_SIZE_PT / height, 1);
    const scaledWidth = Math.max(MIN_PAGE_SIZE_PT, width * scaleDown);
    const scaledHeight = Math.max(MIN_PAGE_SIZE_PT, height * scaleDown);

    return {
        width: scaledWidth,
        height: scaledHeight
    };
}

async function convertSvgToPdf(svgPath, outputPdfPath, profile) {
    const svgContent = readFileSync(svgPath, "utf8");
    const svgDimensions = parseSvgDimensions(svgContent);

    const margins = Number.isFinite(profile?.marginsPt)
        ? Math.max(0, Number(profile.marginsPt))
        : 0;

    let pageWidth = svgDimensions.width + margins * 2;
    let pageHeight = svgDimensions.height + margins * 2;
    let drawX = margins;
    let drawY = margins;
    let drawWidth = svgDimensions.width;
    let drawHeight = svgDimensions.height;

    if (
        profile?.pageMode === "fixed" &&
        Number.isFinite(profile?.fixedWidthPt) &&
        Number.isFinite(profile?.fixedHeightPt) &&
        profile.fixedWidthPt > 0 &&
        profile.fixedHeightPt > 0
    ) {
        pageWidth = profile.fixedWidthPt;
        pageHeight = profile.fixedHeightPt;

        const contentBoxWidth = Math.max(1, pageWidth - margins * 2);
        const contentBoxHeight = Math.max(1, pageHeight - margins * 2);
        const fitted = fitInside(
            svgDimensions.width,
            svgDimensions.height,
            contentBoxWidth,
            contentBoxHeight
        );

        drawWidth = fitted.width;
        drawHeight = fitted.height;

        if (profile.alignX === "center") {
            drawX = margins + (contentBoxWidth - drawWidth) / 2;
        } else if (profile.alignX === "right") {
            drawX = margins + (contentBoxWidth - drawWidth);
        }

        if (profile.alignY === "middle") {
            drawY = margins + (contentBoxHeight - drawHeight) / 2;
        } else if (profile.alignY === "bottom") {
            drawY = margins + (contentBoxHeight - drawHeight);
        }
    } else {
        const maxPageWidth = Number.isFinite(profile?.maxPageWidthPt)
            ? Math.max(1, profile.maxPageWidthPt)
            : MAX_PAGE_SIZE_PT;
        const maxPageHeight = Number.isFinite(profile?.maxPageHeightPt)
            ? Math.max(1, profile.maxPageHeightPt)
            : MAX_PAGE_SIZE_PT;

        const fitScale = Math.min(
            maxPageWidth / pageWidth,
            maxPageHeight / pageHeight,
            1
        );

        pageWidth *= fitScale;
        pageHeight *= fitScale;
        drawWidth *= fitScale;
        drawHeight *= fitScale;
        drawX *= fitScale;
        drawY *= fitScale;

        const minPageWidth = Number.isFinite(profile?.minPageWidthPt)
            ? Math.max(1, profile.minPageWidthPt)
            : MIN_PAGE_SIZE_PT;
        const minPageHeight = Number.isFinite(profile?.minPageHeightPt)
            ? Math.max(1, profile.minPageHeightPt)
            : MIN_PAGE_SIZE_PT;

        pageWidth = Math.max(pageWidth, minPageWidth);
        pageHeight = Math.max(pageHeight, minPageHeight);
    }

    await new Promise((resolve, reject) => {
        const doc = new PDFKitDocument({ autoFirstPage: false });
        const outputStream = createWriteStream(outputPdfPath);

        outputStream.on("finish", resolve);
        outputStream.on("error", reject);
        doc.on("error", reject);

        doc.pipe(outputStream);
        doc.addPage({ size: [pageWidth, pageHeight], margins: { top: 0, left: 0, right: 0, bottom: 0 } });
        SVGtoPDF(doc, svgContent, drawX, drawY, {
            width: drawWidth,
            height: drawHeight,
            preserveAspectRatio: profile?.preserveAspectRatio ?? "xMinYMin meet"
        });
        doc.end();
    });

    if (!existsSync(outputPdfPath)) {
        fail(`Failed to convert SVG to PDF: '${svgPath}'.`);
    }
}

if (!existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
}

let manifest;
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
    fail(`Manifest JSON parse failed: ${error.message}`);
}

if (!Array.isArray(manifest.diagrams) || manifest.diagrams.length === 0) {
    fail("manifest.diagrams must contain at least one entry.");
}

const lockConfig = loadJsonIfExists(lockFilePath);
const lockEnforced = Boolean(lockConfig) && !unlockRequested;

if (lockEnforced && lockConfig.lockSources) {
    assertLockedHashes(lockConfig.sources, "source");
}

if (lockEnforced && lockConfig.lockSvg) {
    assertLockedHashes(lockConfig.svgs, "svg");
}

const pdfProfiles = loadJsonIfExists(pdfProfilesPath) ?? {};

mkdirSync(outputDir, { recursive: true });
mkdirSync(outputSvgDir, { recursive: true });
mkdirSync(path.dirname(mergedPdfPath), { recursive: true });
mkdirSync(path.dirname(reportPath), { recursive: true });

const mermaidCli = resolveMermaidCli();
const exported = [];
const skipped = [];

for (const entry of manifest.diagrams) {
    const sourcePath = path.resolve(rootDir, entry.source);
    const outputSvgPath = path.resolve(outputSvgDir, `${entry.id}.svg`);
    const outputPdfPath = path.resolve(outputDir, `${entry.id}.pdf`);
    const profile = resolvePdfProfile(pdfProfiles, entry);

    if (!existsSync(sourcePath)) {
        if (entry.required) {
            fail(`Missing required source diagram: ${entry.source}`);
        }
        skipped.push({ id: entry.id, reason: "optional source missing" });
        continue;
    }

    console.log(`Exporting ${entry.id} -> ${path.relative(rootDir, outputPdfPath)}`);
    const useLockedSvg = lockEnforced && lockConfig?.lockSvg;
    const engine = profile?.engine ?? "svg-pdfkit";

    if (engine === "native-pdf") {
        exportDiagramPdfNative(mermaidCli, sourcePath, outputPdfPath, profile);
    } else {
        if (useLockedSvg) {
            if (!existsSync(outputSvgPath)) {
                fail(`Locked SVG missing for '${entry.id}': ${path.relative(rootDir, outputSvgPath)}`);
            }
        } else {
            exportDiagramSvg(mermaidCli, sourcePath, outputSvgPath);

            if (entry.type === "sequence" && profile.forceSequenceLifelineToBottom !== false) {
                const originalSvg = readFileSync(outputSvgPath, "utf8");
                const { updatedContent, changed } = normalizeSequenceLifelines(originalSvg);
                if (changed) {
                    writeFileSync(outputSvgPath, updatedContent);
                }
            }
        }

        await convertSvgToPdf(outputSvgPath, outputPdfPath, profile);
    }

    exported.push({
        id: entry.id,
        type: entry.type,
        engine,
        source: path.relative(rootDir, sourcePath),
        svg: path.relative(rootDir, outputSvgPath),
        pdf: path.relative(rootDir, outputPdfPath),
        pdfProfile: profile
    });
}

if (exported.length === 0) {
    fail("No diagrams were exported. Add required Mermaid files under diagrams/src first.");
}

const merged = await PDFDocument.create();
for (const item of exported) {
    const filePath = path.resolve(rootDir, item.pdf);
    const bytes = readFileSync(filePath);
    const inputDoc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(inputDoc, inputDoc.getPageIndices());
    for (const page of pages) {
        merged.addPage(page);
    }
}

writeFileSync(mergedPdfPath, await merged.save());

const report = {
    generatedAt: new Date().toISOString(),
    bookTitle: manifest.bookTitle ?? "Project Diagram Book",
    renderViewport: {
        width: Number.isFinite(renderWidth) ? renderWidth : 5600,
        height: Number.isFinite(renderHeight) ? renderHeight : 4200
    },
    exportStrategy: "mermaid-svg-then-pdfkit-fit",
    lockEnforced,
    lockFile: path.relative(rootDir, lockFilePath),
    profilesFile: path.relative(rootDir, pdfProfilesPath),
    unlockRequested,
    mermaidCliCommand: `${mermaidCli.command} ${mermaidCli.argsPrefix.join(" ")}`.trim(),
    exportedCount: exported.length,
    skippedCount: skipped.length,
    mergedPdf: path.relative(rootDir, mergedPdfPath),
    exported,
    skipped
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Merged PDF written: ${path.relative(rootDir, mergedPdfPath)}`);
console.log(`Build report written: ${path.relative(rootDir, reportPath)}`);
