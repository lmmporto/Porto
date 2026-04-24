#!/usr/bin/env node

/**
 * Export V2 para NotebookLM
 *
 * Uso:
 *   node .\export-code-to-notebooklm.js "." "./NOTEBOOKLM_EXPORT"
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SOURCE_DIR = path.resolve(process.argv[2] || ".");
const OUTPUT_DIR = path.resolve(process.argv[3] || "./NOTEBOOKLM_EXPORT");

const MAX_FILE_SIZE_BYTES = 900_000;

const IGNORED_DIRS = new Set([
    ".git",
    "node_modules",
    ".next",
    ".turbo",
    ".vercel",
    "dist",
    "build",
    "coverage",
    ".cache",
]);

const IGNORED_OUTPUT_DIR_NAMES = new Set([
    "NOTEBOOKLM_EXPORT",
    "NOTEBOOKLM_BACKEND",
    "NOTEBOOKLM_FRONTEND",
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
    ".yml",
    ".yaml",
    ".sql",
    ".css",
    ".scss",
    ".html",
    ".txt",
    ".sh",
    ".env",
    ".env.example",
    ".prisma",
    ".graphql",
    ".gql",
]);

const ALLOWED_FILENAMES = new Set([
    "Dockerfile",
    ".gitignore",
    ".dockerignore",
    "package.json",
    "pnpm-workspace.yaml",
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
]);

const PRIORITY_KEYWORDS = [
    "processcall",
    "analysis",
    "orchestrator",
    "repository",
    "gemini",
    "hubspot",
    "firebase",
    "firestore",
    "worker",
    "webhook",
    "route",
    "dashboard",
    "calls",
    "sdr",
    "auth",
    "middleware",
    "schema",
    "types",
    "service",
];

function log(message) {
    console.log(`[notebooklm-v2] ${message}`);
}

function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function clearOutputDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
    ensureDir(dirPath);
}

function normalizePath(value) {
    return String(value).replace(/\\/g, "/");
}

function getExtension(fileName) {
    if (fileName === ".env") return ".env";
    if (fileName === ".env.example") return ".env.example";
    return path.extname(fileName).toLowerCase();
}

function shouldIgnoreDir(dirName) {
    if (IGNORED_DIRS.has(dirName)) return true;
    if (IGNORED_OUTPUT_DIR_NAMES.has(dirName)) return true;
    return false;
}

function shouldIncludeFile(fileName) {
    if (IGNORED_FILES.has(fileName)) return false;
    if (ALLOWED_FILENAMES.has(fileName)) return true;
    return ALLOWED_EXTENSIONS.has(getExtension(fileName));
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
        ".yml": "yaml",
        ".yaml": "yaml",
        ".sql": "sql",
        ".css": "css",
        ".scss": "scss",
        ".html": "html",
        ".txt": "txt",
        ".sh": "bash",
        ".env": "bash",
        ".env.example": "bash",
        ".prisma": "prisma",
        ".graphql": "graphql",
        ".gql": "graphql",
    };

    if (fileName === "Dockerfile") return "dockerfile";
    return map[ext] || "";
}

function countLines(content) {
    return content ? content.split(/\r?\n/).length : 0;
}

function hashContent(content) {
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function makeSafeMdFilename(relativePath) {
    let normalized = normalizePath(relativePath);

    // Remove .md duplicado
    if (normalized.endsWith(".md")) {
        normalized = normalized.replace(/\.md$/, "");
    }

    // Substitui barras por _
    normalized = normalized.replace(/\//g, "_");

    // Remove caracteres inválidos
    normalized = normalized.replace(/[<>:"|?*]/g, "_");

    return normalized + ".md";
}

function classifyLayer(relativePath) {
    const p = normalizePath(relativePath).toLowerCase();

    if (p.includes("api-server/") || p.includes("backend/") || p.includes("server/")) {
        return "backend";
    }

    if (
        p.includes("frontend/") ||
        p.includes("web/") ||
        p.includes("client/") ||
        p.includes("src/app/") ||
        p.includes("src/components/")
    ) {
        return "frontend";
    }

    if (
        p.includes("package.json") ||
        p.includes("tsconfig") ||
        p.includes("pnpm-workspace") ||
        p.includes("render.yaml") ||
        p.includes("vercel.json")
    ) {
        return "config";
    }

    return "shared";
}

function calculatePriority(relativePath) {
    const p = normalizePath(relativePath).toLowerCase();
    let score = 0;

    for (const keyword of PRIORITY_KEYWORDS) {
        if (p.includes(keyword)) score += 10;
    }

    if (p.includes("/domain/")) score += 15;
    if (p.includes("/infrastructure/")) score += 12;
    if (p.includes("/services/")) score += 12;
    if (p.includes("/routes/")) score += 10;
    if (p.includes("/app/dashboard/")) score += 10;
    if (p.endsWith("package.json")) score += 20;
    if (p.includes("processcall")) score += 40;
    if (p.includes("analysis")) score += 30;

    if (p.includes("components/ui")) score -= 20;
    if (p.includes(".test.")) score -= 15;
    if (p.includes(".spec.")) score -= 15;

    if (score >= 50) return "critical";
    if (score >= 25) return "high";
    if (score >= 10) return "medium";
    return "low";
}

function inferResponsibility(relativePath) {
    const p = normalizePath(relativePath).toLowerCase();

    if (p.includes("processcall")) return "Orquestração do processamento de uma chamada.";
    if (p.includes("analysis") && p.includes("orchestrator")) return "Orquestração do fluxo de análise com IA.";
    if (p.includes("analysis") && p.includes("repository")) return "Persistência e leitura das análises no banco.";
    if (p.includes("gemini")) return "Comunicação com Gemini e tratamento inicial das respostas.";
    if (p.includes("hubspot")) return "Integração com HubSpot.";
    if (p.includes("firebase") || p.includes("firestore")) return "Configuração ou acesso ao Firestore/Firebase.";
    if (p.includes("worker")) return "Execução assíncrona de filas ou reprocessamentos.";
    if (p.includes("webhook")) return "Entrada de eventos externos por webhook.";
    if (p.includes("dashboard")) return "Tela ou componente do dashboard.";
    if (p.includes("auth")) return "Autenticação, sessão ou autorização.";
    if (p.includes("schema")) return "Schemas, validações ou contratos de dados.";
    if (p.includes("types")) return "Tipos e contratos TypeScript.";
    if (p.includes("route")) return "Rota HTTP/API.";
    if (p.endsWith("package.json")) return "Dependências e scripts do pacote.";
    return "Arquivo de suporte do projeto.";
}

function walk(dir, baseDir = dir, acc = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (entry.isDirectory()) {
            if (shouldIgnoreDir(entry.name)) {
                log(`Ignorando pasta: ${normalizePath(relativePath)}`);
                continue;
            }

            walk(fullPath, baseDir, acc);
            continue;
        }

        if (!entry.isFile()) continue;
        if (!shouldIncludeFile(entry.name)) continue;

        const stat = fs.statSync(fullPath);

        if (stat.size > MAX_FILE_SIZE_BYTES) {
            log(`Ignorando arquivo grande: ${normalizePath(relativePath)} (${stat.size} bytes)`);
            continue;
        }

        acc.push({
            fullPath,
            relativePath: normalizePath(relativePath),
            fileName: entry.name,
            size: stat.size,
            layer: classifyLayer(relativePath),
            priority: calculatePriority(relativePath),
        });
    }

    return acc;
}

function buildMarkdownForFile(file) {
    const raw = fs.readFileSync(file.fullPath, "utf8");
    const language = detectLanguage(file.fileName);
    const lineCount = countLines(raw);
    const hash = hashContent(raw);
    const responsibility = inferResponsibility(file.relativePath);

    return `# ${file.fileName}

## Caminho
\`${file.relativePath}\`

## Classificação
- Camada: \`${file.layer}\`
- Prioridade NotebookLM: \`${file.priority}\`
- Linhas: \`${lineCount}\`
- Tamanho: \`${file.size} bytes\`
- Hash: \`${hash}\`

## Responsabilidade inferida
${responsibility}

## Como usar este arquivo no NotebookLM
Use este arquivo para entender responsabilidades, dependências e possíveis impactos de alteração.

## Código

\`\`\`${language}
${raw}
\`\`\`
`;
}

function groupBy(files, key) {
    return files.reduce((acc, file) => {
        const value = file[key];
        acc[value] = acc[value] || [];
        acc[value].push(file);
        return acc;
    }, {});
}

function buildArchitecture(files) {
    const backend = files.filter((f) => f.layer === "backend");
    const frontend = files.filter((f) => f.layer === "frontend");
    const config = files.filter((f) => f.layer === "config");
    const critical = files.filter((f) => f.priority === "critical");

    return `# architecture.md

## Visão geral inferida

Este export contém arquivos de backend, frontend, configuração e suporte do projeto.

## Distribuição
- Backend: ${backend.length}
- Frontend: ${frontend.length}
- Configuração: ${config.length}
- Críticos: ${critical.length}

## Backend
Arquivos classificados como backend geralmente concentram:
- rotas HTTP
- serviços de domínio
- integrações externas
- workers
- persistência
- processamento de chamadas

## Frontend
Arquivos classificados como frontend geralmente concentram:
- páginas Next.js
- componentes de dashboard
- telas de histórico
- telas de SDR
- estados de UI

## Arquivos críticos detectados
${critical.map((f) => `- \`${f.relativePath}\``).join("\n") || "- Nenhum arquivo crítico detectado."}

## Recomendações para usar no NotebookLM
1. Suba primeiro este arquivo.
2. Depois suba \`INDEX.md\`.
3. Depois suba os arquivos em \`00_CRITICAL\`.
4. Depois suba os arquivos em \`01_HIGH\`.
5. Use os demais apenas quando a tarefa exigir.
`;
}

function buildIndex(files) {
    const byLayer = groupBy(files, "layer");
    const byPriority = groupBy(files, "priority");

    const ordered = [...files].sort((a, b) => {
        const rank = { critical: 0, high: 1, medium: 2, low: 3 };
        return rank[a.priority] - rank[b.priority] || a.relativePath.localeCompare(b.relativePath);
    });

    return `# INDEX - NotebookLM Export V2

## Resumo
- Origem: \`${normalizePath(SOURCE_DIR)}\`
- Saída: \`${normalizePath(OUTPUT_DIR)}\`
- Total exportado: \`${files.length}\`

## Por camada
- Backend: ${byLayer.backend?.length || 0}
- Frontend: ${byLayer.frontend?.length || 0}
- Config: ${byLayer.config?.length || 0}
- Shared: ${byLayer.shared?.length || 0}

## Por prioridade
- Critical: ${byPriority.critical?.length || 0}
- High: ${byPriority.high?.length || 0}
- Medium: ${byPriority.medium?.length || 0}
- Low: ${byPriority.low?.length || 0}

## Ordem recomendada de upload no NotebookLM
1. \`architecture.md\`
2. \`INDEX.md\`
3. Pasta \`00_CRITICAL\`
4. Pasta \`01_HIGH\`
5. Arquivos específicos de \`02_MEDIUM\` conforme a tarefa

## Arquivos exportados
${ordered.map((f) => `- [${f.priority}] \`${f.relativePath}\``).join("\n")}
`;
}

function getPriorityFolder(priority) {
    if (priority === "critical") return "00_CRITICAL";
    if (priority === "high") return "01_HIGH";
    if (priority === "medium") return "02_MEDIUM";
    return "03_LOW";
}

function writeExport(files) {
    ensureDir(OUTPUT_DIR);

    for (const file of files) {
        const folder = getPriorityFolder(file.priority);
        const targetDir = path.join(OUTPUT_DIR, folder);
        ensureDir(targetDir);

        const md = buildMarkdownForFile(file);
        const mdFileName = makeSafeMdFilename(file.relativePath);
        const targetPath = path.join(targetDir, mdFileName);

        fs.writeFileSync(targetPath, md, "utf8");
        log(`Exportado [${file.priority}]: ${file.relativePath}`);
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, "INDEX.md"), buildIndex(files), "utf8");
    fs.writeFileSync(path.join(OUTPUT_DIR, "architecture.md"), buildArchitecture(files), "utf8");
}

function main() {
    try {
        log(`Origem: ${SOURCE_DIR}`);
        log(`Saída: ${OUTPUT_DIR}`);

        if (!fs.existsSync(SOURCE_DIR)) {
            throw new Error(`Pasta de origem não encontrada: ${SOURCE_DIR}`);
        }

        clearOutputDir(OUTPUT_DIR);

        const files = walk(SOURCE_DIR);

        if (files.length === 0) {
            fs.writeFileSync(
                path.join(OUTPUT_DIR, "INDEX.md"),
                "# INDEX\n\nNenhum arquivo compatível encontrado.\n",
                "utf8"
            );

            log("Nenhum arquivo compatível encontrado.");
            return;
        }

        writeExport(files);

        log(`Concluído. Total exportado: ${files.length}`);
        log(`Abra a pasta: ${OUTPUT_DIR}`);
    } catch (error) {
        console.error(`[notebooklm-v2] ERRO: ${error.message}`);
        process.exit(1);
    }
}

main();