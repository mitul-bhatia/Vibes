#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REQUIRED_BASE_TYPES = ["class", "object", "use-case", "activity", "sequence"];

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const allowMissingSources = process.argv.includes("--allow-missing-sources");
const manifestPath = path.resolve(process.cwd(), manifestArg);

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

if (!existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
}

let manifest;
try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
    fail(`Manifest is not valid JSON: ${error.message}`);
}

if (!Array.isArray(manifest.requiredTypes)) {
    fail("manifest.requiredTypes must be an array.");
}

for (const type of REQUIRED_BASE_TYPES) {
    if (!manifest.requiredTypes.includes(type)) {
        fail(`requiredTypes is missing '${type}'.`);
    }
}

if (!Array.isArray(manifest.diagrams) || manifest.diagrams.length === 0) {
    fail("manifest.diagrams must be a non-empty array.");
}

const seenIds = new Set();
const requiredTypesSeen = new Set();
const missingRequiredSources = [];

for (const [index, entry] of manifest.diagrams.entries()) {
    if (!entry || typeof entry !== "object") {
        fail(`diagrams[${index}] must be an object.`);
    }

    const { id, type, source, required } = entry;

    if (!id || typeof id !== "string") {
        fail(`diagrams[${index}] is missing a string id.`);
    }
    if (seenIds.has(id)) {
        fail(`Duplicate diagram id found: '${id}'.`);
    }
    seenIds.add(id);

    if (!type || typeof type !== "string") {
        fail(`diagrams[${index}] is missing a string type.`);
    }

    if (!source || typeof source !== "string") {
        fail(`diagrams[${index}] is missing a string source path.`);
    }

    if (required === true) {
        requiredTypesSeen.add(type);
        const sourcePath = path.resolve(process.cwd(), source);
        if (!allowMissingSources && !existsSync(sourcePath)) {
            missingRequiredSources.push(source);
        }
    }
}

for (const type of REQUIRED_BASE_TYPES) {
    if (!requiredTypesSeen.has(type)) {
        fail(`No required diagram entry found for type '${type}'.`);
    }
}

if (missingRequiredSources.length > 0) {
    fail(
        `Missing required Mermaid source files: ${missingRequiredSources.join(", ")}. Run /diagram-suite first.`
    );
}

console.log(`Manifest check passed: ${manifest.diagrams.length} diagrams configured.`);
if (allowMissingSources) {
    console.log("Source existence checks were skipped (--allow-missing-sources).");
}
