#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const outputDirArg = process.argv[3] ?? "diagrams/out/pdf";
const mergedPdfArg = process.argv[4] ?? "diagrams/out/diagram-book.pdf";

const rootDir = process.cwd();
const manifestPath = path.resolve(rootDir, manifestArg);
const outputDir = path.resolve(rootDir, outputDirArg);
const mergedPdfPath = path.resolve(rootDir, mergedPdfArg);
const reportPath = path.resolve(rootDir, "diagrams/out/diagram-build-report.json");

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

function exportDiagram(cli, sourcePath, outputPdfPath) {
    const configPath = path.resolve(rootDir, "diagrams/mermaid-config.json");
    const args = [
        ...cli.argsPrefix,
        "-i",
        sourcePath,
        "-o",
        outputPdfPath,
        "-e",
        "pdf",
        "--scale",
        "1.2",
        "--pdfFit"
    ];

    if (existsSync(configPath)) {
        args.push("--configFile", configPath);
    }

    const render = runCommand(cli.command, args);
    if (render.ok && existsSync(outputPdfPath)) {
        return;
    }

    fail(`Failed to export PDF for '${sourcePath}'.`);
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

mkdirSync(outputDir, { recursive: true });
mkdirSync(path.dirname(mergedPdfPath), { recursive: true });
mkdirSync(path.dirname(reportPath), { recursive: true });

const mermaidCli = resolveMermaidCli();
const exported = [];
const skipped = [];

for (const entry of manifest.diagrams) {
    const sourcePath = path.resolve(rootDir, entry.source);
    const outputPdfPath = path.resolve(outputDir, `${entry.id}.pdf`);

    if (!existsSync(sourcePath)) {
        if (entry.required) {
            fail(`Missing required source diagram: ${entry.source}`);
        }
        skipped.push({ id: entry.id, reason: "optional source missing" });
        continue;
    }

    console.log(`Exporting ${entry.id} -> ${path.relative(rootDir, outputPdfPath)}`);
    exportDiagram(mermaidCli, sourcePath, outputPdfPath);
    exported.push({
        id: entry.id,
        type: entry.type,
        source: path.relative(rootDir, sourcePath),
        pdf: path.relative(rootDir, outputPdfPath)
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
