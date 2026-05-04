#!/usr/bin/env node

/**
 * NOTEBOOKLM EXPORT V3
 *
 * Exporta o repositório em Markdown para NotebookLM, organizando por prioridade:
 * CRITICAL / HIGH / MEDIUM / LOW / SUPPORT
 *
 * Modo A: só backend (api-server/src)
 * Modo B: backend + frontend (api-server/src + frontend/src + configs)
 *
 * Uso:
 *   node scripts/notebook.js A
 *   node scripts/notebook.js B
 *
 * Opcional:
 *   node scripts/notebook.js A "C:/Projetos IA/Porto" "C:/Projetos IA/Porto/NOTEBOOKLM_EXPORT"
 *   node scripts/notebook.js B "." "./NOTEBOOKLM_EXPORT"
 */

const fs = require("fs");
const path = require("path");

// ---------------- CONFIG ----------------

const MODE = (process.argv[2] || "A").toUpperCase();
const SOURCE_DIR = path.resolve(process.argv[3] || ".");
const OUTPUT_DIR = path.resolve(process.argv[4] || "./NOTEBOOKLM_EXPORT");

const EXPORT_FOLDERS = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "SUPPORT"];

const IGNORED_DIRS = new Set([
    ".git",
    ".next",
    ".turbo",
    ".vercel",
    ".idea",
    ".vscode",
    ".cache",
    "node_modules",
    "dist",
    "build",
    "out",
    "coverage",
    "tmp",
    "temp",
]);

const IGNORED_FILES = new Set([
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    ".DS_Store",
]);

const ALLOWED_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".txt",
    ".yml",
    ".yaml",
    ".sql",
    ".css",
    ".scss",
    ".html",
]);

const ALLOWED_FILENAMES = new Set([
    "Dockerfile",
    ".gitignore",
    ".dockerignore",
    "package.json",
    "tsconfig.json",
    "tsconfig.base.json",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.mjs",
    "render.yaml",
    "vercel.json",
    ".env.example",
    "README.md",
]);

// pastas incluídas dependendo do modo
function getRootsByMode() {
    if (MODE === "A") {
        return [
            "api-server/src",
            "api-server/package.json",
            "api-server/tsconfig.json",
            "api-server/README.md",
            "package.json",
            "README.md",
            "CHANGELOG.md",
            ".gemini",
            ".agents",
        ];
    }

    // MODE B
    return [
        "api-server/src",
        "api-server/package.json",
        "api-server/tsconfig.json",
        "api-server/README.md",
        "frontend/src",
        "frontend/package.json",
        "frontend/tsconfig.json",
        "frontend/README.md",
        "frontend/docs",
        "package.json",
        "README.md",
        "CHANGELOG.md",
        ".gemini",
        ".agents",
    ];
}

// ---------------- UTILS ----------------

function log(msg) {
    console.log(`[export-notebooklm] ${msg}`);
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function exists(p) {
    try {
        return fs.existsSync(p);
    } catch {
        return false;
    }
}

function isIgnoredDir(name) {
    return IGNORED_DIRS.has(name);
}

function isIgnoredFile(name) {
    return IGNORED_FILES.has(name);
}

function getExtension(fileName) {
    return path.extname(fileName).toLowerCase();
}

function sanitizeSlashes(p) {
    return String(p).replace(/\\/g, "/");
}

function countLines(content) {
    return (content || "").split(/\r?\n/).length;
}

function isSensitiveOrJunkFile(fileName, relativePath) {
    const lower = fileName.toLowerCase();
    const rel = relativePath.toLowerCase();

    if (lower === ".env") return true;

    // credenciais / chaves
    if (lower.includes("chave-firebase")) return true;
    if (lower.includes("serviceaccount")) return true;
    if (lower.includes("firebase-adminsdk")) return true;
    if (lower.includes("privatekey")) return true;

    // backups / dumps
    if (rel.includes("/backup")) return true;
    if (rel.includes("/backups")) return true;
    if (rel.includes("firestore_backup")) return true;

    // logs
    if (lower.endsWith(".log")) return true;

    return false;
}

function shouldIncludeFile(fileName, relativePath) {
    if (isIgnoredFile(fileName)) return false;
    if (isSensitiveOrJunkFile(fileName, relativePath)) return false;

    if (ALLOWED_FILENAMES.has(fileName)) return true;

    const ext = getExtension(fileName);
    return ALLOWED_EXTENSIONS.has(ext);
}

function detectLanguage(fileName) {
    const ext = getExtension(fileName);

    const map = {
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "js",
        ".jsx": "jsx",
        ".mjs": "js",
        ".cjs": "js",
        ".json": "json",
        ".md": "md",
        ".txt": "text",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".sql": "sql",
        ".css": "css",
        ".scss": "scss",
        ".html": "html",
    };

    if (fileName === "Dockerfile") return "dockerfile";
    if (fileName === ".gitignore") return "text";
    if (fileName === ".env.example") return "bash";

    return map[ext] || "";
}

// transforma caminho original em caminho md
function toMdPath(relativePath) {
    return sanitizeSlashes(relativePath) + ".md";
}

// ---------------- PRIORITY CLASSIFIER ----------------

function classifyPriority(relativePath) {
    const p = sanitizeSlashes(relativePath).toLowerCase();

    // CRITICAL: orquestração e core domain
    if (
        p.includes("orchestrator") ||
        p.includes("analysis.service") ||
        p.includes("analysis.orchestrator") ||
        p.includes("call-processing") ||
        p.includes("call-worker") ||
        p.includes("worker.service") ||
        p.includes("webhook.service") ||
        p.includes("domain/analysis") ||
        p.includes("infrastructure/ai") ||
        p.includes("infrastructure/crm") ||
        p.includes("infrastructure/database") ||
        p.includes("repository") ||
        p.includes("schemas") ||
        p.includes("schema") ||
        p.includes("prompts") ||
        p.includes("prompt") ||
        p.includes("policy")
    ) {
        return "CRITICAL";
    }

    // HIGH: rotas, middleware, firebase, hubspot
    if (
        p.includes("/routes/") ||
        p.includes("/middleware/") ||
        p.includes("firebase") ||
        p.includes("hubspot") ||
        p.includes("config") ||
        p.includes("clients") ||
        p.includes("app.ts") ||
        p.includes("index.ts")
    ) {
        return "HIGH";
    }

    // MEDIUM: utils, constants, types
    if (
        p.includes("/utils") ||
        p.includes("/constants") ||
        p.includes("/types") ||
        p.endsWith(".d.ts")
    ) {
        return "MEDIUM";
    }

    // LOW: scripts, mocks, testes
    if (
        p.includes("/scripts/") ||
        p.includes("/mocks/") ||
        p.includes(".test.") ||
        p.includes("__tests__")
    ) {
        return "LOW";
    }

    // SUPPORT: docs e configs
    if (
        p.endsWith("package.json") ||
        p.endsWith("tsconfig.json") ||
        p.endsWith("readme.md") ||
        p.endsWith("changelog.md") ||
        p.includes("/docs/") ||
        p.endsWith(".md")
    ) {
        return "SUPPORT";
    }

    // default
    return "LOW";
}

// ---------------- FILE DISCOVERY ----------------

function walkRecursive(fullPath, baseDir, acc) {
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
        const dirName = path.basename(fullPath);
        if (isIgnoredDir(dirName)) {
            log(`Ignorando pasta: ${sanitizeSlashes(path.relative(baseDir, fullPath))}`);
            return;
        }

        const entries = fs.readdirSync(fullPath);
        for (const entry of entries) {
            walkRecursive(path.join(fullPath, entry), baseDir, acc);
        }
        return;
    }

    if (!stat.isFile()) return;

    const relativePath = sanitizeSlashes(path.relative(baseDir, fullPath));
    const fileName = path.basename(fullPath);

    if (!shouldIncludeFile(fileName, relativePath)) return;

    acc.push({
        fullPath,
        relativePath,
        fileName,
        size: stat.size,
    });
}

function collectFiles() {
    const roots = getRootsByMode();
    const all = [];

    for (const root of roots) {
        const rootFull = path.join(SOURCE_DIR, root);

        if (!exists(rootFull)) continue;

        walkRecursive(rootFull, SOURCE_DIR, all);
    }

    return all;
}

// ---------------- EXPORT ----------------

function buildMarkdownForFile(file) {
    const raw = fs.readFileSync(file.fullPath, "utf8");
    const language = detectLanguage(file.fileName);
    const lineCount = countLines(raw);

    return `# ${file.fileName}

## Caminho
\`${sanitizeSlashes(file.relativePath)}\`

## Prioridade
\`${classifyPriority(file.relativePath)}\`

## Observações
- Tipo detectado: \`${language || "texto"}\`
- Linhas: \`${lineCount}\`

## Código

\`\`\`${language}
${raw}
\`\`\`
`;
}

function clearOutputDir() {
    if (exists(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    ensureDir(OUTPUT_DIR);

    for (const folder of EXPORT_FOLDERS) {
        ensureDir(path.join(OUTPUT_DIR, folder));
    }
}

function exportFiles(files) {
    let exported = 0;

    for (const file of files) {
        try {
            const priority = classifyPriority(file.relativePath);
            const mdRel = toMdPath(file.relativePath);

            const targetPath = path.join(OUTPUT_DIR, priority, mdRel);

            // garante pastas
            ensureDir(path.dirname(targetPath));

            const md = buildMarkdownForFile(file);
            fs.writeFileSync(targetPath, md, "utf8");

            exported++;
        } catch (err) {
            log(`Falha ao exportar ${file.relativePath}: ${err.message}`);
        }
    }

    return exported;
}

// ---------------- DOC GENERATORS ----------------

function generateArchitectureMap(files) {
    const normalized = files
        .map((f) => sanitizeSlashes(f.relativePath))
        .sort((a, b) => a.localeCompare(b));

    const roots = getRootsByMode().map(sanitizeSlashes);

    const entryCandidates = normalized.filter((p) =>
        p.endsWith("app.ts") ||
        p.endsWith("index.ts") ||
        p.includes("orchestrator") ||
        p.includes("analysis.service") ||
        p.includes("webhook.service") ||
        p.includes("/routes/")
    );

    return `# ARCHITECTURE_MAP

## Modo de exportação
- MODE: ${MODE}
- Source: ${sanitizeSlashes(SOURCE_DIR)}

## Roots incluídos
${roots.map((r) => `- ${r}`).join("\n")}

## Entrypoints detectados (prováveis pontos centrais)
${entryCandidates.length ? entryCandidates.map((e) => `- ${e}`).join("\n") : "- Nenhum detectado"}

## Estrutura completa exportada
${normalized.map((p) => `- ${p}`).join("\n")}
`;
}

function generateCoreFlow(files) {
    const normalized = files.map((f) => sanitizeSlashes(f.relativePath));

    const critical = normalized.filter((p) => classifyPriority(p) === "CRITICAL");
    const high = normalized.filter((p) => classifyPriority(p) === "HIGH");

    const likelyFlow = [
        "Webhook/Entrada (routes/webhook.service)",
        "Orquestração (call-processing.orchestrator / call-worker.orchestrator)",
        "Busca CRM (hubspot-call.service)",
        "Transcrição/IA (gemini.service)",
        "Validação Schema (analysis.schemas / analysis.types)",
        "Persistência (repositories)",
        "Status terminal e métricas",
    ];

    return `# CORE_FLOW

## Objetivo
Documento para orientar o NotebookLM a entender o fluxo do sistema.

## Fluxo provável do sistema (alto nível)
${likelyFlow.map((x, i) => `${i + 1}. ${x}`).join("\n")}

## Arquivos CRITICAL detectados
${critical.length ? critical.map((x) => `- ${x}`).join("\n") : "- Nenhum"}

## Arquivos HIGH detectados
${high.length ? high.map((x) => `- ${x}`).join("\n") : "- Nenhum"}

## Prompt recomendado no NotebookLM
Explique o fluxo completo desde a entrada (HubSpot/webhook) até salvar a análise no Firestore.

Quero:
1. Ordem de execução
2. Arquivos envolvidos
3. Responsabilidade de cada camada
4. Onde a IA é chamada
5. Onde schema/validação acontece
6. Onde status terminal é definido
7. Pontos frágeis
`;
}

function generateIndex(files) {
    const groups = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: [],
        SUPPORT: [],
    };

    for (const f of files) {
        const prio = classifyPriority(f.relativePath);
        groups[prio].push(sanitizeSlashes(f.relativePath));
    }

    for (const key of Object.keys(groups)) {
        groups[key].sort((a, b) => a.localeCompare(b));
    }

    function linkLine(p) {
        return `- [\`${p}\`](./${classifyPriority(p)}/${toMdPath(p)})`;
    }

    return `# INDEX - NOTEBOOKLM EXPORT V3

## Resumo
- MODE: ${MODE}
- Origem: \`${sanitizeSlashes(SOURCE_DIR)}\`
- Saída: \`${sanitizeSlashes(OUTPUT_DIR)}\`
- Total exportado: ${files.length}

## Como usar no NotebookLM (ordem ideal)
1. INDEX.md
2. ARCHITECTURE_MAP.md
3. CORE_FLOW.md
4. Pasta CRITICAL/
5. Pasta HIGH/
6. Depois MEDIUM/LOW/SUPPORT conforme necessidade

---

## CRITICAL
${groups.CRITICAL.length ? groups.CRITICAL.map(linkLine).join("\n") : "- Nenhum"}

---

## HIGH
${groups.HIGH.length ? groups.HIGH.map(linkLine).join("\n") : "- Nenhum"}

---

## MEDIUM
${groups.MEDIUM.length ? groups.MEDIUM.map(linkLine).join("\n") : "- Nenhum"}

---

## LOW
${groups.LOW.length ? groups.LOW.map(linkLine).join("\n") : "- Nenhum"}

---

## SUPPORT
${groups.SUPPORT.length ? groups.SUPPORT.map(linkLine).join("\n") : "- Nenhum"}
`;
}

// ---------------- MAIN ----------------

function main() {
    try {
        log(`NotebookLM Export V3`);
        log(`MODE: ${MODE}`);
        log(`Origem: ${SOURCE_DIR}`);
        log(`Saída: ${OUTPUT_DIR}`);

        if (!exists(SOURCE_DIR)) {
            throw new Error(`Pasta de origem não existe: ${SOURCE_DIR}`);
        }

        clearOutputDir();

        const files = collectFiles();

        if (!files.length) {
            fs.writeFileSync(path.join(OUTPUT_DIR, "INDEX.md"), "# INDEX\n\nNenhum arquivo encontrado.\n", "utf8");
            log("Nenhum arquivo encontrado.");
            return;
        }

        const exported = exportFiles(files);

        // docs extras
        fs.writeFileSync(path.join(OUTPUT_DIR, "ARCHITECTURE_MAP.md"), generateArchitectureMap(files), "utf8");
        fs.writeFileSync(path.join(OUTPUT_DIR, "CORE_FLOW.md"), generateCoreFlow(files), "utf8");
        fs.writeFileSync(path.join(OUTPUT_DIR, "INDEX.md"), generateIndex(files), "utf8");

        log(`Concluído. Arquivos exportados: ${exported}`);
        log(`Abra a pasta: ${OUTPUT_DIR}`);
    } catch (err) {
        console.error(`[export-notebooklm] ERRO: ${err.message}`);
        process.exit(1);
    }
}

main();