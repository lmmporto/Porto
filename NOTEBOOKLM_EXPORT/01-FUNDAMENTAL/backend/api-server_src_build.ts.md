# build.ts

## Visão geral
- Caminho original: `api-server/src/build.ts`
- Domínio: **backend**
- Prioridade: **01-FUNDAMENTAL**
- Tipo: **source-file**
- Criticidade: **supporting**
- Score de importância: **110**
- Entry point: **não**
- Arquivo central de fluxo: **sim**
- Linhas: **81**
- Imports detectados: **4**
- Exports detectados: **0**
- Funções/classes detectadas: **1**

## Resumo factual
Este arquivo foi classificado como source-file no domínio backend. Criticidade: supporting. Prioridade: 01-FUNDAMENTAL. Funções/classes detectadas: buildAll. Dependências externas detectadas: esbuild, fs/promises, path, url. Variáveis de ambiente detectadas: NODE_ENV. Temas relevantes detectados: calls, email, session, token. Indícios de framework/arquitetura: express, zod, axios.

## Dependências locais
_Nenhuma dependência local detectada_

## Dependências externas
- `esbuild`
- `fs/promises`
- `path`
- `url`

## Todos os imports detectados
- `esbuild`
- `fs/promises`
- `path`
- `url`

## Exports detectados
_Nenhum export detectado_

## Funções e classes detectadas
- `buildAll`

## Endpoints detectados
_Nenhum padrão de endpoint detectado_

## Variáveis de ambiente detectadas
- `NODE_ENV`

## Temas relevantes
- `calls`
- `email`
- `session`
- `token`

## Indícios de framework/arquitetura
- `express`
- `zod`
- `axios`

## Código
```ts
import path from "path";
import { fileURLToPath } from "url";
import { build as esbuild } from "esbuild";
import { rm, readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times without risking some
// packages that are not bundle compatible
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  // 🚩 Ajustado para garantir que a pasta dist fique na raiz do projeto
  const distDir = path.resolve(__dirname, "../dist");
  await rm(distDir, { recursive: true, force: true });

  console.log("building server...");
  
  // 🚩 Ajustado: Agora o build.ts está em src/, então o package.json está um nível acima
  const pkgPath = path.resolve(__dirname, "../package.json");
  
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter(
    (dep) =>
      !allowlist.includes(dep) &&
      !(pkg.dependencies?.[dep]?.startsWith("workspace:")),
  );

  await esbuild({
    // 🚩 Ajustado: O index.ts está na mesma pasta (src/) que este script de build
    entryPoints: [path.resolve(__dirname, "index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    // Adicionamos 'react', 'react-dom' e 'lucide-react' na lista de externos forçados para evitar erros de auto-import
    external: [...externals, 'react', 'react-dom', 'lucide-react'], 
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
```
