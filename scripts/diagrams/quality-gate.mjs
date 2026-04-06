#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const manifestPath = path.resolve(process.cwd(), manifestArg);

const TYPE_RULES = {
    class: { requiredPattern: /(^|\n)\s*classDiagram\b/m, minNodeHints: 6, minEdgeHints: 5 },
    object: { requiredPattern: /(^|\n)\s*(flowchart|graph)\b/m, minNodeHints: 6, minEdgeHints: 5 },
    "use-case": { requiredPattern: /(^|\n)\s*(flowchart|graph)\b/m, minNodeHints: 7, minEdgeHints: 6 },
    activity: { requiredPattern: /(^|\n)\s*(flowchart|graph)\b/m, minNodeHints: 8, minEdgeHints: 7 },
    sequence: { requiredPattern: /(^|\n)\s*sequenceDiagram\b/m, minNodeHints: 5, minEdgeHints: 6 },
    erd: { requiredPattern: /(^|\n)\s*erDiagram\b/m, minNodeHints: 4, minEdgeHints: 4 }
};

function fail(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

function countEdges(text) {
    const edgePattern = /(-{1,2}>|-->>|-->|---|==>|o--|\|\|--\|\{|\}\|--\|\{|\|o--o\{|\|\|--o\{|\|\|--\|\{|\}o--\|\||\}\|--\|\|)/g;
    return (text.match(edgePattern) ?? []).length;
}

function countNodeHints(text) {
    const genericNodePattern = /\[[^\]]+\]|\([^\)]+\)|\{[^\}]+\}|"[^"]+"|\bparticipant\b|\bclass\b\s+[A-Za-z0-9_]+/g;
    return (text.match(genericNodePattern) ?? []).length;
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

if (!Array.isArray(manifest.diagrams)) {
    fail("manifest.diagrams must be an array.");
}

const findings = [];

for (const entry of manifest.diagrams) {
    if (!entry.required) {
        continue;
    }

    const sourcePath = path.resolve(process.cwd(), entry.source);
    if (!existsSync(sourcePath)) {
        findings.push(`[${entry.id}] required source missing: ${entry.source}`);
        continue;
    }

    const rule = TYPE_RULES[entry.type];
    if (!rule) {
        continue;
    }

    const text = readFileSync(sourcePath, "utf8");

    if (!rule.requiredPattern.test(text)) {
        findings.push(`[${entry.id}] missing required Mermaid declaration for type '${entry.type}'.`);
    }

    const nodeHints = countNodeHints(text);
    const edgeHints = countEdges(text);

    if (nodeHints < rule.minNodeHints) {
        findings.push(`[${entry.id}] appears too shallow: found ${nodeHints} node hints, require >= ${rule.minNodeHints}.`);
    }

    if (edgeHints < rule.minEdgeHints) {
        findings.push(`[${entry.id}] appears under-connected: found ${edgeHints} edge hints, require >= ${rule.minEdgeHints}.`);
    }
}

if (findings.length > 0) {
    fail(`Mermaid quality gate failed:\n- ${findings.join("\n- ")}`);
}

console.log("Mermaid quality gate passed for required diagrams.");
