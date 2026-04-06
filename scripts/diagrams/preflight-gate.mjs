#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const manifestArg = process.argv[2] ?? "diagrams/manifest.json";
const manifestPath = path.resolve(process.cwd(), manifestArg);

const CHECKS_BY_TYPE = {
    class: [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*classDiagram\b/m.test(text),
            message: "must start with classDiagram declaration"
        },
        {
            id: "relationships",
            check: (text) => /<\|--|\*--|o--|-->|\.\.>|\.\.\|>|--|\.\./.test(text),
            message: "must include UML relationships (inheritance/composition/aggregation/association/dependency)"
        },
        {
            id: "members",
            check: (text) => /\{[\s\S]*\}|\s:[\s]*[+\-#~]?[A-Za-z_]/m.test(text),
            message: "must include meaningful members or attribute/method definitions"
        }
    ],
    object: [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*(flowchart|graph)\s+(LR|RL|TB|TD|BT)\b/m.test(text),
            message: "must declare a directional flowchart"
        },
        {
            id: "runtime-instance-labels",
            check: (text) => /\"[^\"\n]*:[A-Za-z][^\"\n]*\"|\[[^\]\n]*:[A-Za-z][^\]\n]*\]/m.test(text),
            message: "must include runtime instance labels like instanceId:ClassName"
        },
        {
            id: "grouping",
            check: (text) => /(^|\n)\s*subgraph\b/m.test(text),
            message: "must use subgraph grouping for alignment/readability"
        }
    ],
    "use-case": [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*(flowchart|graph)\s+(LR|RL|TB|TD|BT)\b/m.test(text),
            message: "must declare a directional flowchart"
        },
        {
            id: "actors",
            check: (text) => /\(\([^\)\n]+\)\)/m.test(text),
            message: "must include actor nodes with circular notation"
        },
        {
            id: "system-boundary",
            check: (text) => /(^|\n)\s*subgraph\s+.*(System|Platform|Use Cases|UseCases)/im.test(text),
            message: "must define a system/use-case boundary subgraph"
        }
    ],
    activity: [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*(flowchart|graph)\s+(TD|TB|LR|RL|BT)\b/m.test(text),
            message: "must declare a directional flowchart"
        },
        {
            id: "decision-nodes",
            check: (text) => /\{[^\}\n]+\}/m.test(text),
            message: "must include decision nodes"
        },
        {
            id: "guard-labels",
            check: (text) => /--\s*[^\-\n][^\n]*\s*-->/m.test(text),
            message: "must include labeled guard branches"
        },
        {
            id: "start-end",
            check: (text) => /(Start\(|\[Start\]|Start\[)/.test(text) && /(End\(|\[End\]|End\[)/.test(text),
            message: "must include explicit Start and End nodes"
        }
    ],
    sequence: [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*sequenceDiagram\b/m.test(text),
            message: "must start with sequenceDiagram declaration"
        },
        {
            id: "autonumber",
            check: (text) => /(^|\n)\s*autonumber\b/m.test(text),
            message: "must enable autonumber for traceability"
        },
        {
            id: "participants",
            check: (text) => ((text.match(/(^|\n)\s*(participant|actor)\s+/g) ?? []).length >= 4),
            message: "must declare at least 4 participants/actors"
        },
        {
            id: "control-block",
            check: (text) => /(^|\n)\s*(alt|opt|loop|par|critical|break)\b/m.test(text),
            message: "must include at least one control-flow block (alt/opt/loop/par/critical/break)"
        }
    ],
    erd: [
        {
            id: "declaration",
            check: (text) => /(^|\n)\s*erDiagram\b/m.test(text),
            message: "must start with erDiagram declaration"
        },
        {
            id: "cardinality-relations",
            check: (text) => /(\|\||\|o|o\||o\{|\|\{|\}\||\}o)\s*(--|\.\.)\s*(\|\||\|o|o\||o\{|\|\{|\}\||\}o)/.test(text),
            message: "must include cardinality relationships"
        },
        {
            id: "entity-attributes",
            check: (text) => /(^|\n)\s*[A-Z0-9_\-\"\[\] ]+\s*\{[\s\S]*?\}/m.test(text),
            message: "must include at least one entity attribute block"
        },
        {
            id: "key-markers",
            check: (text) => /\bPK\b|\bFK\b|\bUK\b/.test(text),
            message: "must include key markers (PK/FK/UK) for schema clarity"
        }
    ]
};

const PLACEHOLDER_PATTERN = /\b(TODO|TBD|FIXME|XXX)\b/i;
const FLOW_END_BREAK_PATTERN = /\[[ ]*end[ ]*\]|\([ ]*end[ ]*\)|\{[ ]*end[ ]*\}/m;

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
    fail(`Invalid manifest JSON: ${error.message}`);
}

if (!Array.isArray(manifest.diagrams)) {
    fail("manifest.diagrams must be an array.");
}

const findings = [];

for (const entry of manifest.diagrams) {
    const sourcePath = path.resolve(process.cwd(), entry.source);
    const shouldCheck = entry.required === true || existsSync(sourcePath);

    if (!shouldCheck) {
        continue;
    }

    if (!existsSync(sourcePath)) {
        findings.push(`[${entry.id}] missing source file: ${entry.source}`);
        continue;
    }

    const text = readFileSync(sourcePath, "utf8");

    if (PLACEHOLDER_PATTERN.test(text)) {
        findings.push(`[${entry.id}] contains placeholder tokens (TODO/TBD/FIXME/XXX)`);
    }

    if ((entry.type === "activity" || entry.type === "object" || entry.type === "use-case") && FLOW_END_BREAK_PATTERN.test(text)) {
        findings.push(`[${entry.id}] uses lowercase 'end' as node text; use 'End' or quote it to avoid Mermaid breakage`);
    }

    const checks = CHECKS_BY_TYPE[entry.type] ?? [];
    for (const check of checks) {
        if (!check.check(text)) {
            findings.push(`[${entry.id}] ${check.message}`);
        }
    }
}

if (findings.length > 0) {
    fail(`Mermaid preflight failed:\n- ${findings.join("\n- ")}`);
}

console.log("Mermaid preflight passed: all required diagram-type checks succeeded.");
