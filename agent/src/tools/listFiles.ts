import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { config } from "../config.js";

const DEFAULT_MAX_RESULTS = 50;

export const listFilesTool: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "list_files",
    description: "Lista arquivos de um diretório específico do projeto",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Diretório relativo ao projeto (ex: src, agent, lib)",
        },
        limit: {
          type: "number",
          description: "Quantidade máxima de arquivos a retornar",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

export async function handleListFiles(args: {
  path?: string;
  limit?: number;
}): Promise<string> {
  try {
    const relativePath = args.path?.trim() || ".";
    const rawLimit = Number(args.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(Math.floor(rawLimit), 100))
      : DEFAULT_MAX_RESULTS;

    const projectRoot = path.resolve(config.projectRoot);
    const targetDir = path.resolve(projectRoot, relativePath);
    const relativeToRoot = path.relative(projectRoot, targetDir);

    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
      return JSON.stringify({
        ok: false,
        error: "Caminho fora da raiz do projeto.",
        path: relativePath,
      });
    }

    const stat = await fs.stat(targetDir);

    if (!stat.isDirectory()) {
      return JSON.stringify({
        ok: false,
        error: "O caminho informado não é um diretório.",
        path: relativePath,
        resolvedPath: targetDir,
      });
    }

    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    const files = entries
      .filter(
        (e) =>
          ![
            "node_modules",
            ".git",
            "dist",
            "build",
            ".next",
            ".turbo",
            ".cache",
          ].includes(e.name),
      )
      .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, limit);

    return JSON.stringify({
      ok: true,
      path: relativePath,
      resolvedPath: targetDir,
      files,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return JSON.stringify({
      ok: false,
      error: message,
      requestedPath: args.path || ".",
      projectRoot: config.projectRoot,
    });
  }
}
