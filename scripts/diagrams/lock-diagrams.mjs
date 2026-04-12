#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const manifestPath = path.resolve(rootDir, process.argv[2] ?? "diagrams/manifest.json");
const lockPath = path.resolve(rootDir, process.argv[3] ?? "diagrams/diagram-lock.json");

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

function sha256(filePath) {
    const hash = createHash("sha256");
    hash.update(readFileSync(filePath));
    return hash.digest("hex");
}

if (!existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
}

let manifest;
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
    fail(`Invalid manifest JSON: ${error.message}`);
}

if (!Array.isArray(manifest.diagrams) || manifest.diagrams.length === 0) {
    fail("manifest.diagrams must contain at least one entry.");
}

const sourceHashes = {};
const svgHashes = {};

for (const entry of manifest.diagrams) {
    const sourceAbsolute = path.resolve(rootDir, entry.source);
    if (!existsSync(sourceAbsolute)) {
        fail(`Cannot lock missing source: ${entry.source}`);
    }

    const sourceRelative = path.relative(rootDir, sourceAbsolute);
    sourceHashes[sourceRelative] = sha256(sourceAbsolute);

    const svgAbsolute = path.resolve(rootDir, `diagrams/out/svg/${entry.id}.svg`);
    if (!existsSync(svgAbsolute)) {
        fail(`Cannot lock missing SVG: diagrams/out/svg/${entry.id}.svg`);
    }

    const svgRelative = path.relative(rootDir, svgAbsolute);
    svgHashes[svgRelative] = sha256(svgAbsolute);
}

const lockPayload = {
    version: 1,
    lockedAt: new Date().toISOString(),
    lockSources: true,
    lockSvg: true,
    sources: sourceHashes,
    svgs: svgHashes
};

writeFileSync(lockPath, `${JSON.stringify(lockPayload, null, 2)}\n`);

console.log(`Lock file written: ${path.relative(rootDir, lockPath)}`);
console.log(`Locked sources: ${Object.keys(sourceHashes).length}`);
console.log(`Locked SVGs: ${Object.keys(svgHashes).length}`);
