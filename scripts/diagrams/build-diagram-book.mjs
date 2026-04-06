#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
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

function resolveDrawioBinary() {
  const envBin = process.env.DRAWIO_BIN;
  const candidates = [
    envBin,
    "drawio",
    "draw.io",
    "/Applications/draw.io.app/Contents/MacOS/draw.io"
  ].filter(Boolean);

  for (const candidate of candidates) {
    const isPathCandidate = candidate.includes("/");
    if (isPathCandidate && !existsSync(candidate)) {
      continue;
    }

    const probe = spawnSync(candidate, ["--version"], { cwd: rootDir, stdio: "ignore" });
    if (!probe.error) {
      return candidate;
    }
  }

  fail(
    "No draw.io CLI binary found. Set DRAWIO_BIN or install draw.io desktop. macOS default: /Applications/draw.io.app/Contents/MacOS/draw.io"
  );
}

function exportDiagram(binary, sourcePath, outputPdfPath) {
  const modernArgs = ["--export", "--format", "pdf", "--output", outputPdfPath, sourcePath];
  const legacyArgs = ["-x", "-f", "pdf", "-o", outputPdfPath, sourcePath];

  const modern = runCommand(binary, modernArgs);
  if (modern.ok && existsSync(outputPdfPath)) {
    return;
  }

  const legacy = runCommand(binary, legacyArgs);
  if (legacy.ok && existsSync(outputPdfPath)) {
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

const drawioBinary = resolveDrawioBinary();
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
  exportDiagram(drawioBinary, sourcePath, outputPdfPath);
  exported.push({
    id: entry.id,
    type: entry.type,
    source: path.relative(rootDir, sourcePath),
    pdf: path.relative(rootDir, outputPdfPath)
  });
}

if (exported.length === 0) {
  fail("No diagrams were exported. Add required draw.io files under diagrams/src first.");
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
  drawioBinary,
  exportedCount: exported.length,
  skippedCount: skipped.length,
  mergedPdf: path.relative(rootDir, mergedPdfPath),
  exported,
  skipped
};

writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Merged PDF written: ${path.relative(rootDir, mergedPdfPath)}`);
console.log(`Build report written: ${path.relative(rootDir, reportPath)}`);
