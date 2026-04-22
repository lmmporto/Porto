# notebook.js

## Visão geral
- Caminho original: `notebook.js`
- Domínio: **shared**
- Prioridade: **03-SUPPORTING**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **40**
- Entry point: **não**
- Arquivo central de fluxo: **não**
- Linhas: **1541**
- Imports detectados: **2**
- Exports detectados: **0**
- Funções/classes detectadas: **52**

## Resumo factual
Este arquivo foi classificado como source-file no domínio shared. Criticidade: supporting. Prioridade: 03-SUPPORTING. Funções/classes detectadas: analyzeContent, boolFlagExists, buildArchitectureMarkdown, buildFactualSummary, buildFileMarkdown, buildFlowSummary, buildIndexMarkdown, buildSystemOverview, deepMerge, detectFrameworkHints. Dependências externas detectadas: fs, path. Temas relevantes detectados: admin, analysis, auth, calls, coaching, crm, dashboard, email, evolution, firebase. Indícios de framework/arquitetura: express, prisma, zod, react-query, firebase, axios.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `fs`
- `path`

## Todos os imports detectados
- `fs`
- `path`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `analyzeContent`
- `boolFlagExists`
- `buildArchitectureMarkdown`
- `buildFactualSummary`
- `buildFileMarkdown`
- `buildFlowSummary`
- `buildIndexMarkdown`
- `buildSystemOverview`
- `deepMerge`
- `detectFrameworkHints`
- `ensureDir`
- `escapeRegExp`
- `extractApiPatterns`
- `extractEnvKeys`
- `extractExports`
- `extractImports`
- `extractNamedFunctions`
- `extractRelevantKeywords`
- `getCriticality`
- `getDomain`
- `getExternalImports`
- `getImportanceScore`
- `getKind`
- `getLanguageTag`
- `getLocalImports`
- `getPriority`
- `getSegments`
- `groupBy`
- `inferFlowRole`
- `isAllowedFile`
- `isCoreFlowFile`
- `isEntryPoint`
- `items`
- `loadUserConfig`
- `normalizePath`
- `pathHasExcludedDir`
- `previewCode`
- `rel`
- `removeDir`
- `run`
- `safeFileName`
- `shouldExclude`
- `sortObjectKeys`
- `splitLines`
- `take`
- `toRegexArray`
- `truncate`
- `tryReadDir`
- `tryReadFile`
- `tryStat`
- `unique`
- `walk`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
_Nenhuma variável de ambiente detectada_

## Temas relevantes
- `admin`
- `analysis`
- `auth`
- `calls`
- `coaching`
- `crm`
- `dashboard`
- `email`
- `evolution`
- `firebase`
- `health`
- `hubspot`
- `insights`
- `job`
- `metrics`
- `notification`
- `parser`
- `queue`
- `ranking`
- `sdr`
- `session`
- `stats`
- `summarize`
- `summary`
- `team`
- `token`
- `transcribe`
- `upload`
- `webhook`
- `worker`

## Indícios de framework/arquitetura
- `express`
- `prisma`
- `zod`
- `react-query`
- `firebase`
- `axios`

## Código
```js
#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

// ======================================================
// DEFAULT CONFIG
// ======================================================

const DEFAULT_CONFIG = {
    excludedDirs: [
        "node_modules",
        ".git",
        ".next",
        "dist",
        "build",
        "coverage",
        "out",
        ".turbo",
        ".cache",
        ".vercel",
        ".idea",
        ".vscode",
        "tmp",
        "temp",
        "NOTEBOOKLM_EXPORT",
        "NOTEBOOKLM_EXPORT_SMART",
        "NOTEBOOKLM_BACKEND",
        ".history",
    ],
    excludedFileNames: [
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
        ".env.test",
        ".DS_Store",
        "Thumbs.db",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
    ],
    excludedFilePatterns: [
        "\\.pem$",
        "\\.key$",
        "\\.crt$",
        "\\.p12$",
        "\\.pfx$",
        "\\.cer$",
        "\\.der$",
        "serviceAccount",
        "firebase",
        "credential",
        "credentials",
        "secret",
        "token",
        "chave",
        "private",
        "oauth",
    ],
    allowedExtensions: [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mjs", ".cjs"],
    binaryExtensions: [
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".ico",
        ".pdf",
        ".zip",
        ".gz",
        ".tar",
        ".mp3",
        ".wav",
        ".mp4",
        ".mov",
        ".avi",
        ".sqlite",
        ".db",
    ],
    priorityRules: [
        {
            priority: "01-FUNDAMENTAL",
            matchers: [
                "/routes/",
                "/services/",
                "/middleware/",
                "/ai/flows/",
                "/features/",
                "/context/",
                "/api/",
                "/hooks/usecallsengine",
                "/hooks/usesdrdashboardsync",
                "/hooks/usecalls",
                "/hooks/use",
                "/src/app.ts",
                "/src/index.ts",
                "/app.ts",
                "/index.ts",
                "/config.ts",
                "/clients.ts",
                "/build.ts",
                "/types/",
                "/constants/",
            ],
        },
        {
            priority: "02-HIGH-VALUE",
            matchers: [
                "/components/dashboard/",
                "/components/layout/",
                "/dashboard/",
                "/calls/",
                "/coaching/",
                "/evolution/",
                "/gaps/",
                "/insights/",
                "/sdrs/",
                "/team/",
                "/teams/",
                "/utils/",
                "/lib/",
                "/app/",
            ],
        },
        {
            priority: "99-LOW-PRIORITY",
            matchers: [
                "/components/ui/",
                "/mocks/",
                ".mock.",
                "skeleton",
                "placeholder",
                "toast",
                "tooltip",
                "accordion",
                "dialog",
                "popover",
                "tabs",
                "table",
                "checkbox",
                "radio-group",
                "dropdown-menu",
            ],
        },
    ],
    frontendCoreRouteHints: [
        "/app/dashboard/",
        "/app/calls/",
        "/app/coaching/",
        "/app/evolution/",
        "/app/gaps/",
        "/app/insights/",
        "/app/sdrs/",
        "/app/team/",
        "/app/teams/",
        "/app/upload/",
        "/app/me/",
        "/app/ranking/",
    ],
    backendHints: [
        "api-server",
        "/routes/",
        "/services/",
        "/middleware/",
        "/constants/",
        "/clients.ts",
        "/config.ts",
        "/hubspot",
        "/webhook",
    ],
    aiHints: [
        "/ai/",
        "genkit",
        "transcribe",
        "summarize",
        "extract-key-points",
    ],
    maxFileSizeBytes: 300000,
    includeLowPriorityCode: false,
    includeFullCodeByDefault: true,
    maxCodePreviewLinesForLowPriority: 0,
};

const CONFIG_FILE_NAME = "notebooklm-export.config.json";

// ======================================================
// CONFIG LOAD
// ======================================================

function deepMerge(base, extra) {
    if (!extra || typeof extra !== "object") return base;
    const result = { ...base };

    for (const [key, value] of Object.entries(extra)) {
        if (Array.isArray(value)) {
            result[key] = value;
            continue;
        }

        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            base[key] &&
            typeof base[key] === "object" &&
            !Array.isArray(base[key])
        ) {
            result[key] = deepMerge(base[key], value);
            continue;
        }

        result[key] = value;
    }

    return result;
}

function loadUserConfig(inputRoot) {
    const configPath = path.join(inputRoot, CONFIG_FILE_NAME);

    if (!fs.existsSync(configPath)) {
        return {
            config: DEFAULT_CONFIG,
            configPath: null,
        };
    }

    try {
        const raw = fs.readFileSync(configPath, "utf-8");
        const parsed = JSON.parse(raw);
        const merged = deepMerge(DEFAULT_CONFIG, parsed);

        return {
            config: merged,
            configPath,
        };
    } catch (err) {
        console.warn(`⚠️ Falha ao carregar ${CONFIG_FILE_NAME}: ${err.message}`);
        return {
            config: DEFAULT_CONFIG,
            configPath: null,
        };
    }
}

// ======================================================
// UTILS
// ======================================================

function normalizePath(p) {
    return p.split(path.sep).join("/");
}

function rel(root, fullPath) {
    return normalizePath(path.relative(root, fullPath));
}

function getSegments(p) {
    return normalizePath(p).split("/");
}

function ensureDir(dir) {
    fs.mkdirSync(dir, { recursive: true });
}

function removeDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function tryReadDir(dir) {
    try {
        return fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.warn(`⚠️ Falha ao ler diretório: ${dir}`);
        return [];
    }
}

function tryStat(p) {
    try {
        return fs.statSync(p);
    } catch (err) {
        return null;
    }
}

function tryReadFile(filePath) {
    try {
        return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
        return null;
    }
}

function safeFileName(relativePath) {
    return normalizePath(relativePath)
        .replace(/^\.?\//, "")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

function unique(arr) {
    return [...new Set(arr)];
}

function truncate(str, max) {
    if (!str) return "";
    if (str.length <= max) return str;
    return `${str.slice(0, max - 3)}...`;
}

function groupBy(arr, keyFn) {
    const map = {};
    for (const item of arr) {
        const key = keyFn(item);
        if (!map[key]) map[key] = [];
        map[key].push(item);
    }
    return map;
}

function sortObjectKeys(obj) {
    return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toRegexArray(patterns) {
    return (patterns || []).map((pattern) => new RegExp(pattern, "i"));
}

function boolFlagExists(argv, flagName) {
    return argv.includes(flagName);
}

// ======================================================
// LANGUAGE TAG
// ======================================================

function getLanguageTag(filePath) {
    switch (path.extname(filePath).toLowerCase()) {
        case ".ts":
            return "ts";
        case ".tsx":
            return "tsx";
        case ".js":
            return "js";
        case ".jsx":
            return "jsx";
        case ".mjs":
            return "js";
        case ".cjs":
            return "js";
        case ".json":
            return "json";
        case ".md":
            return "md";
        default:
            return "";
    }
}

// ======================================================
// FILTERS
// ======================================================

function pathHasExcludedDir(p, config) {
    const segments = getSegments(p);
    const excluded = new Set(config.excludedDirs || []);
    return segments.some((segment) => excluded.has(segment));
}

function shouldExclude(filePath, config) {
    const base = path.basename(filePath);
    const ext = path.extname(base).toLowerCase();
    const excludedNames = new Set(config.excludedFileNames || []);
    const binaryExts = new Set(config.binaryExtensions || []);
    const excludedPatterns = toRegexArray(config.excludedFilePatterns || []);

    if (excludedNames.has(base)) return true;
    if (pathHasExcludedDir(filePath, config)) return true;
    if (binaryExts.has(ext)) return true;
    if (excludedPatterns.some((re) => re.test(base))) return true;

    return false;
}

function isAllowedFile(filePath, config) {
    const ext = path.extname(filePath).toLowerCase();
    const allowed = new Set(config.allowedExtensions || []);
    return allowed.has(ext);
}

// ======================================================
// WALKER (ITERATIVE)
// ======================================================

function walk(rootDir, config) {
    const collected = [];
    const stack = [rootDir];

    while (stack.length) {
        const currentDir = stack.pop();
        const entries = tryReadDir(currentDir);

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (shouldExclude(fullPath, config)) continue;

            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }

            if (!entry.isFile()) continue;
            if (!isAllowedFile(fullPath, config)) continue;

            const stat = tryStat(fullPath);
            if (!stat) continue;

            collected.push({
                fullPath,
                stat,
            });
        }
    }

    return collected;
}

// ======================================================
// CLASSIFICATION
// ======================================================

function getDomain(filePath, config) {
    const p = normalizePath(filePath).toLowerCase();

    if ((config.aiHints || []).some((hint) => p.includes(String(hint).toLowerCase()))) {
        return "ai";
    }

    if ((config.backendHints || []).some((hint) => p.includes(String(hint).toLowerCase()))) {
        return "backend";
    }

    if (
        p.includes("/app/") ||
        p.includes("/components/") ||
        p.includes("/features/") ||
        p.includes("/hooks/") ||
        p.includes("/context/") ||
        (config.frontendCoreRouteHints || []).some((hint) => p.includes(String(hint).toLowerCase()))
    ) {
        return "frontend";
    }

    return "shared";
}

function getPriority(filePath, config) {
    const p = normalizePath(filePath).toLowerCase();

    for (const rule of config.priorityRules || []) {
        if ((rule.matchers || []).some((m) => p.includes(String(m).toLowerCase()))) {
            return rule.priority;
        }
    }

    if (
        p.endsWith("/package.json") ||
        p.endsWith("/tsconfig.json") ||
        p.endsWith("/pnpm-lock.yaml") ||
        p.endsWith("/readme.md") ||
        p.endsWith("/instructions.md")
    ) {
        return "01-FUNDAMENTAL";
    }

    return "03-SUPPORTING";
}

function getKind(filePath) {
    const p = normalizePath(filePath).toLowerCase();
    const base = path.basename(p);

    if (base === "package.json") return "package-config";
    if (base === "tsconfig.json") return "typescript-config";
    if (base === "readme.md" || base === "instructions.md") return "documentation";
    if (p.includes("/routes/")) return "route";
    if (p.includes("/services/")) return "service";
    if (p.includes("/middleware/")) return "middleware";
    if (p.includes("/context/")) return "context";
    if (p.includes("/hooks/")) return "hook";
    if (p.includes("/features/") && p.includes("/api/")) return "feature-api";
    if (p.includes("/features/") && p.includes("/components/")) return "feature-component";
    if (p.includes("/components/ui/")) return "ui-component";
    if (p.includes("/components/")) return "component";
    if (p.includes("/app/") && base === "page.tsx") return "page";
    if (p.includes("/app/") && base === "layout.tsx") return "layout";
    if (p.includes("/ai/flows/")) return "ai-flow";
    if (p.includes("/types/")) return "type-definition";
    if (p.includes("/constants/")) return "constant";
    if (p.includes("/utils/")) return "utility";
    if (base === "app.ts" || base === "index.ts") return "bootstrap";
    if (base === "config.ts") return "config";
    if (base === "clients.ts") return "client-config";

    return "source-file";
}

function getCriticality(kind) {
    const criticalKinds = new Set([
        "bootstrap",
        "route",
        "service",
        "middleware",
        "config",
        "client-config",
        "ai-flow",
    ]);

    const importantKinds = new Set([
        "page",
        "layout",
        "hook",
        "context",
        "feature-api",
        "feature-component",
        "component",
        "type-definition",
        "constant",
        "utility",
        "package-config",
        "typescript-config",
        "documentation",
    ]);

    if (criticalKinds.has(kind)) return "critical";
    if (importantKinds.has(kind)) return "important";
    return "supporting";
}

function getImportanceScore(priority, kind, domain, criticality) {
    let score = 0;

    if (priority === "01-FUNDAMENTAL") score += 100;
    if (priority === "02-HIGH-VALUE") score += 70;
    if (priority === "03-SUPPORTING") score += 40;
    if (priority === "99-LOW-PRIORITY") score += 10;

    if (domain === "backend") score += 10;
    if (domain === "ai") score += 12;
    if (kind === "route") score += 20;
    if (kind === "service") score += 18;
    if (kind === "ai-flow") score += 20;
    if (kind === "feature-api") score += 16;
    if (kind === "page") score += 12;
    if (kind === "bootstrap") score += 20;
    if (kind === "config") score += 15;

    if (criticality === "critical") score += 20;
    if (criticality === "important") score += 8;

    return score;
}

function isEntryPoint(filePath, kind) {
    const p = normalizePath(filePath).toLowerCase();
    const base = path.basename(p);

    if (kind === "bootstrap") return true;
    if (kind === "route") return true;
    if (kind === "page") return true;
    if (base === "main.ts" || base === "main.js") return true;
    if (base === "server.ts" || base === "server.js") return true;
    if (base === "package.json") return true;

    return false;
}

function isCoreFlowFile(kind, priority) {
    if (priority === "01-FUNDAMENTAL") return true;
    return new Set(["route", "service", "middleware", "page", "hook", "context", "ai-flow"]).has(kind);
}

// ======================================================
// CODE ANALYSIS
// ======================================================

function extractImports(content) {
    const results = [];

    const importRegexes = [
        /import\s+[\s\S]*?\s+from\s+["'`](.+?)["'`]/g,
        /import\s*["'`](.+?)["'`]/g,
        /require\(\s*["'`](.+?)["'`]\s*\)/g,
        /import\(\s*["'`](.+?)["'`]\s*\)/g,
    ];

    for (const regex of importRegexes) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) results.push(match[1].trim());
        }
    }

    return unique(results).sort();
}

function extractExports(content) {
    const results = [];

    const patterns = [
        /export\s+default\s+function\s+([A-Za-z0-9_]+)/g,
        /export\s+default\s+class\s+([A-Za-z0-9_]+)/g,
        /export\s+default\s+([A-Za-z0-9_]+)/g,
        /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
        /export\s+class\s+([A-Za-z0-9_]+)/g,
        /export\s+const\s+([A-Za-z0-9_]+)/g,
        /export\s+let\s+([A-Za-z0-9_]+)/g,
        /export\s+var\s+([A-Za-z0-9_]+)/g,
        /export\s+type\s+([A-Za-z0-9_]+)/g,
        /export\s+interface\s+([A-Za-z0-9_]+)/g,
        /module\.exports\s*=\s*([A-Za-z0-9_]+)/g,
    ];

    for (const regex of patterns) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) results.push(match[1].trim());
        }
    }

    const namedExportRegex = /export\s*\{\s*([^}]+)\s*\}/g;
    let namedMatch;
    while ((namedMatch = namedExportRegex.exec(content)) !== null) {
        const raw = namedMatch[1] || "";
        const parts = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        for (const part of parts) {
            const normalized = part.replace(/\s+as\s+/i, " as ").trim();
            results.push(normalized);
        }
    }

    return unique(results).sort();
}

function extractNamedFunctions(content) {
    const results = [];

    const patterns = [
        /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_]+)/g,
        /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/g,
        /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?[A-Za-z0-9_<>{}\[\],:\s|&]*=>/g,
        /(?:export\s+)?let\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?[A-Za-z0-9_<>{}\[\],:\s|&]*=>/g,
        /(?:export\s+)?var\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?[A-Za-z0-9_<>{}\[\],:\s|&]*=>/g,
        /class\s+([A-Za-z0-9_]+)/g,
    ];

    for (const regex of patterns) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) results.push(match[1].trim());
        }
    }

    return unique(results).sort();
}

function extractApiPatterns(content) {
    const routes = [];
    const methods = ["get", "post", "put", "patch", "delete"];

    for (const method of methods) {
        const regex = new RegExp(`\\.${method}\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]`, "g");
        let match;
        while ((match = regex.exec(content)) !== null) {
            routes.push(`${method.toUpperCase()} ${match[1]}`);
        }
    }

    const nextRouteRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;
    let routeMatch;
    while ((routeMatch = nextRouteRegex.exec(content)) !== null) {
        routes.push(`${routeMatch[1].toUpperCase()} [NextRouteHandler]`);
    }

    return unique(routes);
}

function extractEnvKeys(content) {
    const keys = [];
    const regexes = [
        /process\.env\.([A-Z0-9_]+)/g,
        /process\.env\[\s*["'`]([A-Z0-9_]+)["'`]\s*\]/g,
    ];

    for (const regex of regexes) {
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match[1]) keys.push(match[1]);
        }
    }

    return unique(keys).sort();
}

function extractRelevantKeywords(content) {
    const candidates = [
        "hubspot",
        "firebase",
        "webhook",
        "transcribe",
        "summary",
        "summarize",
        "analysis",
        "coaching",
        "metrics",
        "worker",
        "dashboard",
        "insights",
        "evolution",
        "calls",
        "sdr",
        "team",
        "ranking",
        "upload",
        "auth",
        "admin",
        "stats",
        "health",
        "parser",
        "queue",
        "job",
        "crm",
        "email",
        "notification",
        "session",
        "token",
    ];

    const lower = content.toLowerCase();
    return candidates.filter((c) => lower.includes(c)).sort();
}

function detectFrameworkHints(filePath, content) {
    const hints = [];
    const p = normalizePath(filePath).toLowerCase();

    if (p.endsWith(".tsx")) hints.push("react/tsx");
    if (p.includes("/app/")) hints.push("next-app-router");
    if (/['"]use client['"]/.test(content)) hints.push("client-component");
    if (/['"]use server['"]/.test(content)) hints.push("server-component-or-action");
    if (/express|router\s*=|express\.router/i.test(content)) hints.push("express");
    if (/genkit|defineFlow|ai/i.test(content) && p.includes("/ai/")) hints.push("ai-flow");
    if (/export\s+default\s+function\s+Page|const\s+Page\s*=/.test(content) && p.includes("/app/")) {
        hints.push("page-component");
    }
    if (/prisma/i.test(content)) hints.push("prisma");
    if (/zod/i.test(content)) hints.push("zod");
    if (/react-query|@tanstack\/react-query/i.test(content)) hints.push("react-query");
    if (/next\/navigation|next\/server/i.test(content)) hints.push("next-runtime");
    if (/firebase/i.test(content)) hints.push("firebase");
    if (/axios/i.test(content)) hints.push("axios");

    return unique(hints);
}

function splitLines(content) {
    return content.split(/\r?\n/);
}

function previewCode(content, maxLines) {
    if (!maxLines || maxLines <= 0) return "";
    const lines = splitLines(content);
    if (lines.length <= maxLines) return content;
    return lines.slice(0, maxLines).join("\n") + "\n// ... conteúdo omitido ...";
}

function getLocalImports(imports) {
    return imports.filter((i) => i.startsWith(".") || i.startsWith("@/"));
}

function getExternalImports(imports) {
    return imports.filter((i) => !i.startsWith(".") && !i.startsWith("@/"));
}

function buildFactualSummary(meta, analysis) {
    const lines = [];

    lines.push(`Este arquivo foi classificado como ${meta.kind} no domínio ${meta.domain}.`);
    lines.push(`Criticidade: ${meta.criticality}. Prioridade: ${meta.priority}.`);

    if (analysis.exports.length) {
        lines.push(`Exports detectados: ${analysis.exports.slice(0, 8).join(", ")}.`);
    }

    if (analysis.namedFunctions.length) {
        lines.push(`Funções/classes detectadas: ${analysis.namedFunctions.slice(0, 10).join(", ")}.`);
    }

    if (analysis.apiPatterns.length) {
        lines.push(`Padrões de endpoint detectados: ${analysis.apiPatterns.slice(0, 8).join(", ")}.`);
    }

    const localImports = getLocalImports(analysis.imports);
    if (localImports.length) {
        lines.push(`Dependências locais detectadas: ${localImports.slice(0, 8).join(", ")}.`);
    }

    const externalImports = getExternalImports(analysis.imports);
    if (externalImports.length) {
        lines.push(`Dependências externas detectadas: ${externalImports.slice(0, 8).join(", ")}.`);
    }

    if (analysis.envKeys.length) {
        lines.push(`Variáveis de ambiente detectadas: ${analysis.envKeys.slice(0, 8).join(", ")}.`);
    }

    if (analysis.keywords.length) {
        lines.push(`Temas relevantes detectados: ${analysis.keywords.slice(0, 10).join(", ")}.`);
    }

    if (analysis.frameworkHints.length) {
        lines.push(`Indícios de framework/arquitetura: ${analysis.frameworkHints.join(", ")}.`);
    }

    return lines.join(" ");
}

function analyzeContent(filePath, content) {
    const imports = extractImports(content);
    const exportsFound = extractExports(content);
    const namedFunctions = extractNamedFunctions(content);
    const apiPatterns = extractApiPatterns(content);
    const envKeys = extractEnvKeys(content);
    const keywords = extractRelevantKeywords(content);
    const frameworkHints = detectFrameworkHints(filePath, content);

    const lineCount = splitLines(content).length;
    const importCount = imports.length;
    const exportCount = exportsFound.length;
    const functionCount = namedFunctions.length;

    return {
        imports,
        exports: exportsFound,
        namedFunctions,
        apiPatterns,
        envKeys,
        keywords,
        frameworkHints,
        lineCount,
        importCount,
        exportCount,
        functionCount,
    };
}

// ======================================================
// FLOW INFERENCE
// ======================================================

function inferFlowRole(kind, domain) {
    if (kind === "page") return "page";
    if (kind === "layout") return "layout";
    if (kind === "component" || kind === "feature-component" || kind === "ui-component") return "component";
    if (kind === "hook") return "hook";
    if (kind === "feature-api") return "feature-api";
    if (kind === "route") return "route";
    if (kind === "middleware") return "middleware";
    if (kind === "service") return "service";
    if (kind === "client-config") return "client";
    if (kind === "ai-flow") return "ai-flow";
    if (kind === "context") return "context";
    if (kind === "utility") return "utility";
    if (domain === "backend") return "backend-module";
    if (domain === "frontend") return "frontend-module";
    return "shared-module";
}

function buildFlowSummary(exportedFiles) {
    const byRole = groupBy(exportedFiles, (f) => inferFlowRole(f.meta.kind, f.meta.domain));

    const take = (role, max = 8) =>
        (byRole[role] || [])
            .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
            .slice(0, max)
            .map((f) => `- \`${f.meta.relativePath}\``)
            .join("\n") || "_Nenhum arquivo detectado_";

    return `# FLOW SUMMARY

## Objetivo
Este arquivo resume o fluxo provável do sistema com base nos tipos de arquivos, domínio e imports detectados.

## Fluxo provável do frontend
Fluxo sugerido:
1. páginas/layouts iniciam a navegação e a renderização
2. componentes organizam a interface
3. hooks/context centralizam estado e efeitos
4. feature-api/utils fazem integração e transformação de dados

### Páginas
${take("page")}

### Layouts
${take("layout")}

### Componentes
${take("component")}

### Hooks
${take("hook")}

### Contextos
${take("context")}

### Feature APIs
${take("feature-api")}

## Fluxo provável do backend
Fluxo sugerido:
1. rotas recebem requisições
2. middlewares aplicam validação/autorização
3. services executam regra de negócio
4. clients/configs conectam integrações externas

### Rotas
${take("route")}

### Middlewares
${take("middleware")}

### Services
${take("service")}

### Clients / integrações
${take("client")}

## Fluxo provável de IA
Fluxo sugerido:
1. entrada por página/rota/upload
2. processamento em fluxo de IA
3. geração de resumo, análise ou extração de dados

### AI flows
${take("ai-flow")}

## Observação
Este fluxo é heurístico. Use junto com:
- SYSTEM_OVERVIEW.md
- ARCHITECTURE.md
- INDEX.md
- MANIFEST.json
`;
}

// ======================================================
// OVERVIEW BUILDERS
// ======================================================

function buildSystemOverview(exportedFiles, manifest) {
    const byDomain = groupBy(exportedFiles, (f) => f.meta.domain);
    const criticalFiles = exportedFiles
        .filter((f) => f.meta.criticality === "critical")
        .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
        .slice(0, 20);

    const importantFiles = exportedFiles
        .filter((f) => f.meta.criticality === "important")
        .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
        .slice(0, 20);

    const keywords = unique(
        exportedFiles.flatMap((f) => f.analysis.keywords || [])
    ).sort();

    const integrations = unique(
        exportedFiles.flatMap((f) =>
            (f.analysis.imports || []).filter((imp) =>
                [
                    "axios",
                    "firebase",
                    "hubspot",
                    "openai",
                    "genkit",
                    "prisma",
                    "stripe",
                    "supabase",
                ].some((name) => imp.toLowerCase().includes(name))
            )
        )
    ).sort();

    const entryPoints = exportedFiles
        .filter((f) => f.meta.isEntryPoint)
        .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
        .slice(0, 15);

    const coreFlowFiles = exportedFiles
        .filter((f) => f.meta.isCoreFlowFile)
        .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
        .slice(0, 20);

    const domainLines = Object.entries(byDomain)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([domain, files]) => `- ${domain}: ${files.length} arquivos`)
        .join("\n");

    const criticalLines =
        criticalFiles.map((f) => `- \`${f.meta.relativePath}\` — ${f.meta.kind}`).join("\n") ||
        "_Nenhum arquivo crítico detectado_";

    const importantLines =
        importantFiles.map((f) => `- \`${f.meta.relativePath}\` — ${f.meta.kind}`).join("\n") ||
        "_Nenhum arquivo importante detectado_";

    const entryLines =
        entryPoints.map((f) => `- \`${f.meta.relativePath}\``).join("\n") ||
        "_Nenhum entry point detectado_";

    const coreLines =
        coreFlowFiles.map((f) => `- \`${f.meta.relativePath}\` — ${f.meta.kind}`).join("\n") ||
        "_Nenhum arquivo central de fluxo detectado_";

    const integrationLines =
        integrations.map((i) => `- \`${i}\``).join("\n") ||
        "_Nenhuma integração externa claramente detectada_";

    const keywordLines =
        keywords.map((k) => `- ${k}`).join("\n") ||
        "_Nenhuma palavra-chave relevante detectada_";

    return `# SYSTEM OVERVIEW

## Objetivo
Este material foi gerado para ajudar o NotebookLM e a leitura humana a entenderem o sistema de forma mais confiável.

## Visão geral do sistema
- Total de arquivos exportados: **${manifest.summary.totalExported}**
- Arquivos ignorados por tamanho: **${manifest.summary.skippedLargeFilesCount || 0}**
- Arquivos ignorados por leitura inválida: **${manifest.summary.skippedUnreadableFilesCount || 0}**

## Distribuição por domínio
${domainLines || "_Nenhum arquivo detectado_"}

## Arquivos de entrada do sistema
${entryLines}

## Arquivos críticos
${criticalLines}

## Arquivos importantes
${importantLines}

## Núcleo provável do fluxo
${coreLines}

## Integrações externas detectadas
${integrationLines}

## Temas recorrentes detectados
${keywordLines}

## Ordem recomendada de leitura
1. SYSTEM_OVERVIEW.md
2. FLOW_SUMMARY.md
3. ARCHITECTURE.md
4. INDEX.md
5. Arquivos críticos
6. Arquivos importantes
7. Arquivos de suporte

## Observação
Use este arquivo como ponto de partida para orientar o NotebookLM antes de aprofundar a leitura dos arquivos individuais.
`;
}

function buildArchitectureMarkdown(exportedFiles) {
    const byDomain = groupBy(exportedFiles, (f) => f.meta.domain);
    const byPriority = groupBy(exportedFiles, (f) => f.meta.priority);
    const byCriticality = groupBy(exportedFiles, (f) => f.meta.criticality);

    const topFiles = [...exportedFiles]
        .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
        .slice(0, 30);

    const domainSection = Object.entries(byDomain)
        .map(([domain, files]) => {
            const kinds = groupBy(files, (f) => f.meta.kind);
            const kindLines = Object.entries(kinds)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([kind, items]) => `  - ${kind}: ${items.length}`)
                .join("\n");

            return `### ${domain}\n- arquivos: ${files.length}\n${kindLines || ""}`;
        })
        .join("\n\n");

    const prioritySection = Object.entries(byPriority)
        .map(([priority, files]) => `- ${priority}: ${files.length} arquivos`)
        .join("\n");

    const criticalitySection = Object.entries(byCriticality)
        .map(([criticality, files]) => `- ${criticality}: ${files.length} arquivos`)
        .join("\n");

    const topSection = topFiles
        .map(
            (f) =>
                `- \`${f.meta.relativePath}\` — ${f.meta.kind}, ${f.meta.domain}, criticidade ${f.meta.criticality}, score ${f.meta.importanceScore}`
        )
        .join("\n");

    return `# ARCHITECTURE

## Objetivo
Este material foi exportado para maximizar compreensão por IA e leitura humana no NotebookLM.

## Estratégia de organização
- **01-FUNDAMENTAL**: fluxo principal do sistema, bootstrap, rotas, serviços, contexto, IA, APIs centrais e configs essenciais
- **02-HIGH-VALUE**: componentes e módulos importantes para entendimento do produto
- **03-SUPPORTING**: suporte útil para contexto técnico
- **99-LOW-PRIORITY**: mocks, UI genérica e arquivos de menor valor explicativo

## Níveis de criticidade
- **critical**: arquivos centrais para entender o funcionamento
- **important**: arquivos relevantes para comportamento e uso
- **supporting**: arquivos auxiliares

## Resumo por domínio
${domainSection || "_Nenhum arquivo exportado_"}

## Resumo por prioridade
${prioritySection || "_Nenhum arquivo exportado_"}

## Resumo por criticidade
${criticalitySection || "_Nenhum arquivo exportado_"}

## Arquivos mais importantes
${topSection || "_Nenhum arquivo exportado_"}

## Leitura sugerida para compreensão rápida
1. Comece por **critical**
2. Depois leia **01-FUNDAMENTAL/backend**
3. Em seguida **01-FUNDAMENTAL/ai**
4. Depois **01-FUNDAMENTAL/frontend**
5. Use **02-HIGH-VALUE** para aprofundamento
6. Deixe **99-LOW-PRIORITY** por último
`;
}

function buildIndexMarkdown(exportedFiles, outputRoot) {
    const grouped = groupBy(exportedFiles, (f) => `${f.meta.priority}__${f.meta.domain}`);
    const priorities = ["01-FUNDAMENTAL", "02-HIGH-VALUE", "03-SUPPORTING", "99-LOW-PRIORITY"];
    const domains = ["backend", "frontend", "ai", "shared"];

    let md = "# INDEX\n\n";
    md += "## Navegação principal\n\n";
    md += "- [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)\n";
    md += "- [FLOW_SUMMARY.md](FLOW_SUMMARY.md)\n";
    md += "- [ARCHITECTURE.md](ARCHITECTURE.md)\n";
    md += "- [MANIFEST.json](MANIFEST.json)\n\n";

    for (const priority of priorities) {
        md += `## ${priority}\n\n`;

        for (const domain of domains) {
            const key = `${priority}__${domain}`;
            const items = (grouped[key] || []).sort(
                (a, b) => b.meta.importanceScore - a.meta.importanceScore
            );

            md += `### ${domain}\n\n`;

            if (!items.length) {
                md += "_Nenhum arquivo_\n\n";
                continue;
            }

            for (const item of items) {
                const link = normalizePath(path.relative(outputRoot, item.outputPath));
                md += `- [${item.meta.relativePath}](${link}) — ${item.meta.kind}, criticidade ${item.meta.criticality}, score ${item.meta.importanceScore}\n`;
            }

            md += "\n";
        }
    }

    return md;
}

// ======================================================
// PER-FILE MARKDOWN
// ======================================================

function buildFileMarkdown(meta, content, analysis, options = {}) {
    const lang = getLanguageTag(meta.originalPath);
    const importsSection = analysis.imports.length
        ? analysis.imports.map((i) => `- \`${i}\``).join("\n")
        : "_Nenhum import detectado_";

    const exportsSection = analysis.exports.length
        ? analysis.exports.map((e) => `- \`${e}\``).join("\n")
        : "_Nenhum export detectado_";

    const functionsSection = analysis.namedFunctions.length
        ? analysis.namedFunctions.map((f) => `- \`${f}\``).join("\n")
        : "_Nenhuma função/classe detectada_";

    const apiSection = analysis.apiPatterns.length
        ? analysis.apiPatterns.map((r) => `- \`${r}\``).join("\n")
        : "_Nenhum padrão de endpoint detectado_";

    const envSection = analysis.envKeys.length
        ? analysis.envKeys.map((k) => `- \`${k}\``).join("\n")
        : "_Nenhuma variável de ambiente detectada_";

    const keywordsSection = analysis.keywords.length
        ? analysis.keywords.map((k) => `- \`${k}\``).join("\n")
        : "_Nenhuma palavra-chave relevante detectada_";

    const frameworkSection = analysis.frameworkHints.length
        ? analysis.frameworkHints.map((h) => `- \`${h}\``).join("\n")
        : "_Nenhum indício específico detectado_";

    const localDepsSection = getLocalImports(analysis.imports).length
        ? getLocalImports(analysis.imports).map((i) => `- \`${i}\``).join("\n")
        : "_Nenhuma dependência local detectada_";

    const externalDepsSection = getExternalImports(analysis.imports).length
        ? getExternalImports(analysis.imports).map((i) => `- \`${i}\``).join("\n")
        : "_Nenhuma dependência externa detectada_";

    let codeSection = "_Código omitido para reduzir ruído_";
    if (options.includeCode) {
        const codeToRender = options.codePreview || content;
        codeSection = `\`\`\`${lang}\n${codeToRender}\n\`\`\``;
    }

    return `# ${path.basename(meta.originalPath)}

## Visão geral
- Caminho original: \`${meta.relativePath}\`
- Domínio: **${meta.domain}**
- Prioridade: **${meta.priority}**
- Tipo: **${meta.kind}**
- Criticidade: **${meta.criticality}**
- Score de importância: **${meta.importanceScore}**
- Entry point: **${meta.isEntryPoint ? "sim" : "não"}**
- Arquivo central de fluxo: **${meta.isCoreFlowFile ? "sim" : "não"}**
- Linhas: **${analysis.lineCount}**
- Imports detectados: **${analysis.importCount}**
- Exports detectados: **${analysis.exportCount}**
- Funções/classes detectadas: **${analysis.functionCount}**

## Resumo factual
${meta.summary}

## Dependências locais
${localDepsSection}

## Dependências externas
${externalDepsSection}

## Todos os imports detectados
${importsSection}

## Exports detectados
${exportsSection}

## Funções e classes detectadas
${functionsSection}

## Endpoints detectados
${apiSection}

## Variáveis de ambiente detectadas
${envSection}

## Temas relevantes
${keywordsSection}

## Indícios de framework/arquitetura
${frameworkSection}

## Código
${codeSection}
`;
}

// ======================================================
// MAIN
// ======================================================

function run(inputDir, outputDir, cliOptions = {}) {
    const inputRoot = path.resolve(inputDir || ".");
    const outputRoot = path.resolve(outputDir || "./NOTEBOOKLM_EXPORT");

    if (inputRoot === outputRoot) {
        throw new Error("A pasta de saída não pode ser igual à pasta de origem.");
    }

    const inputStat = tryStat(inputRoot);
    if (!inputStat || !inputStat.isDirectory()) {
        throw new Error(`Pasta de origem inválida: ${inputRoot}`);
    }

    const { config: loadedConfig, configPath } = loadUserConfig(inputRoot);
    const config = {
        ...loadedConfig,
        includeLowPriorityCode:
            typeof cliOptions.includeLowPriorityCode === "boolean"
                ? cliOptions.includeLowPriorityCode
                : loadedConfig.includeLowPriorityCode,
    };

    removeDir(outputRoot);
    ensureDir(outputRoot);

    const files = walk(inputRoot, config);
    const exportedFiles = [];
    const skippedLargeFiles = [];
    const skippedUnreadableFiles = [];

    const manifest = {
        generatedAt: new Date().toISOString(),
        inputRoot,
        outputRoot,
        configPath,
        configUsed: config,
        totalFilesScanned: files.length,
        exportedFiles: [],
        skippedLargeFiles: [],
        skippedUnreadableFiles: [],
        summary: {},
    };

    for (const { fullPath, stat } of files) {
        if (stat.size > config.maxFileSizeBytes) {
            skippedLargeFiles.push({
                relativePath: rel(inputRoot, fullPath),
                sizeBytes: stat.size,
            });
            continue;
        }

        const content = tryReadFile(fullPath);
        if (content === null) {
            skippedUnreadableFiles.push({
                relativePath: rel(inputRoot, fullPath),
            });
            console.warn(`⚠️ Falha ao ler arquivo: ${fullPath}`);
            continue;
        }

        const relativePath = rel(inputRoot, fullPath);
        const domain = getDomain(fullPath, config);
        const priority = getPriority(fullPath, config);
        const kind = getKind(fullPath);
        const criticality = getCriticality(kind);
        const isEntry = isEntryPoint(fullPath, kind);
        const isCore = isCoreFlowFile(kind, priority);
        const importanceScore = getImportanceScore(priority, kind, domain, criticality);
        const analysis = analyzeContent(fullPath, content);

        const meta = {
            originalPath: fullPath,
            relativePath,
            domain,
            priority,
            kind,
            criticality,
            importanceScore,
            isEntryPoint: isEntry,
            isCoreFlowFile: isCore,
            summary: "",
        };

        meta.summary = buildFactualSummary(meta, analysis);

        const destinationDir = path.join(outputRoot, priority, domain);
        ensureDir(destinationDir);

        const fileName = `${safeFileName(relativePath)}.md`;
        const outputPath = path.join(destinationDir, fileName);

        const includeCode =
            priority === "99-LOW-PRIORITY"
                ? !!config.includeLowPriorityCode
                : !!config.includeFullCodeByDefault;

        const codePreview =
            priority === "99-LOW-PRIORITY" && config.maxCodePreviewLinesForLowPriority > 0
                ? previewCode(content, config.maxCodePreviewLinesForLowPriority)
                : null;

        const md = buildFileMarkdown(meta, content, analysis, {
            includeCode,
            codePreview,
        });

        fs.writeFileSync(outputPath, md, "utf-8");

        exportedFiles.push({
            meta,
            analysis,
            outputPath,
            sizeBytes: stat.size,
        });

        manifest.exportedFiles.push({
            relativePath,
            outputPath: normalizePath(path.relative(outputRoot, outputPath)),
            domain,
            priority,
            kind,
            criticality,
            importanceScore,
            isEntryPoint: isEntry,
            isCoreFlowFile: isCore,
            sizeBytes: stat.size,
            lineCount: analysis.lineCount,
            importCount: analysis.importCount,
            exportCount: analysis.exportCount,
            functionCount: analysis.functionCount,
            imports: analysis.imports,
            exports: analysis.exports,
            functions: analysis.namedFunctions,
            apiPatterns: analysis.apiPatterns,
            envKeys: analysis.envKeys,
            keywords: analysis.keywords,
            frameworkHints: analysis.frameworkHints,
            summary: meta.summary,
        });
    }

    manifest.skippedLargeFiles = skippedLargeFiles;
    manifest.skippedUnreadableFiles = skippedUnreadableFiles;

    manifest.summary = {
        totalExported: exportedFiles.length,
        skippedLargeFilesCount: skippedLargeFiles.length,
        skippedUnreadableFilesCount: skippedUnreadableFiles.length,
        byDomain: sortObjectKeys(
            Object.fromEntries(
                Object.entries(groupBy(exportedFiles, (f) => f.meta.domain)).map(([k, v]) => [k, v.length])
            )
        ),
        byPriority: sortObjectKeys(
            Object.fromEntries(
                Object.entries(groupBy(exportedFiles, (f) => f.meta.priority)).map(([k, v]) => [k, v.length])
            )
        ),
        byKind: sortObjectKeys(
            Object.fromEntries(
                Object.entries(groupBy(exportedFiles, (f) => f.meta.kind)).map(([k, v]) => [k, v.length])
            )
        ),
        byCriticality: sortObjectKeys(
            Object.fromEntries(
                Object.entries(groupBy(exportedFiles, (f) => f.meta.criticality)).map(([k, v]) => [k, v.length])
            )
        ),
        entryPoints: exportedFiles
            .filter((f) => f.meta.isEntryPoint)
            .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
            .map((f) => f.meta.relativePath),
        coreFlowFiles: exportedFiles
            .filter((f) => f.meta.isCoreFlowFile)
            .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
            .slice(0, 30)
            .map((f) => f.meta.relativePath),
        topImportantFiles: [...exportedFiles]
            .sort((a, b) => b.meta.importanceScore - a.meta.importanceScore)
            .slice(0, 20)
            .map((f) => ({
                relativePath: f.meta.relativePath,
                domain: f.meta.domain,
                priority: f.meta.priority,
                kind: f.meta.kind,
                criticality: f.meta.criticality,
                score: f.meta.importanceScore,
            })),
    };

    const systemOverviewMd = buildSystemOverview(exportedFiles, manifest);
    const flowSummaryMd = buildFlowSummary(exportedFiles);
    const architectureMd = buildArchitectureMarkdown(exportedFiles);
    const indexMd = buildIndexMarkdown(exportedFiles, outputRoot);

    fs.writeFileSync(path.join(outputRoot, "SYSTEM_OVERVIEW.md"), systemOverviewMd, "utf-8");
    fs.writeFileSync(path.join(outputRoot, "FLOW_SUMMARY.md"), flowSummaryMd, "utf-8");
    fs.writeFileSync(path.join(outputRoot, "ARCHITECTURE.md"), architectureMd, "utf-8");
    fs.writeFileSync(path.join(outputRoot, "INDEX.md"), indexMd, "utf-8");
    fs.writeFileSync(
        path.join(outputRoot, "MANIFEST.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
    );

    console.log("✅ Export concluído com sucesso!");
    console.log(`📁 Origem: ${inputRoot}`);
    console.log(`📦 Saída: ${outputRoot}`);
    console.log(`🧾 Arquivos exportados: ${exportedFiles.length}`);
    console.log(`🚫 Ignorados por tamanho: ${skippedLargeFiles.length}`);
    console.log(`⚠️ Ignorados por falha de leitura: ${skippedUnreadableFiles.length}`);
    console.log(
        "📚 Arquivos gerados: SYSTEM_OVERVIEW.md, FLOW_SUMMARY.md, ARCHITECTURE.md, INDEX.md, MANIFEST.json + markdowns por arquivo"
    );
}

// ======================================================
// CLI
// ======================================================

const argv = process.argv.slice(2);
const inputDir = argv[0] || ".";
const outputDir = argv[1] || "./NOTEBOOKLM_EXPORT";
const cliOptions = {
    includeLowPriorityCode: boolFlagExists(argv, "--include-low-priority-code"),
};

try {
    run(inputDir, outputDir, cliOptions);
} catch (err) {
    console.error(`❌ Erro: ${err.message}`);
    process.exit(1);
}
```
