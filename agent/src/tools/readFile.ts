import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { config } from "../config.js";

export const readFileTool: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "read_file",
    description: "Lê o conteúdo de um arquivo do projeto",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho relativo do arquivo dentro do projeto",
        },
      },
      required: ["path"],
      additionalProperties: false,
    },
  },
};

export async function handleReadFile(args: { path: string }): Promise<string> {
  try {
    const relativePath = String(args.path || "").trim();

    if (!relativePath) {
      return JSON.stringify({
        ok: false,
        error: "Path não informado.",
      });
    }

    const projectRoot = path.resolve(config.projectRoot);
    const targetFile = path.resolve(projectRoot, relativePath);
    const relativeToRoot = path.relative(projectRoot, targetFile);

    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
      return JSON.stringify({
        ok: false,
        error: "Caminho fora da raiz do projeto.",
        path: relativePath,
      });
    }

    const stat = await fs.stat(targetFile);

    if (!stat.isFile()) {
      return JSON.stringify({
        ok: false,
        error: "O caminho informado não é um arquivo.",
        path: relativePath,
      });
    }

    if (stat.size > config.maxFileBytes) {
      return JSON.stringify({
        ok: false,
        error: `Arquivo muito grande para leitura direta. Limite: ${config.maxFileBytes} bytes.`,
        path: relativePath,
        size: stat.size,
      });
    }

    const content = await fs.readFile(targetFile, "utf8");

    return JSON.stringify({
      ok: true,
      path: relativePath,
      content,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return JSON.stringify({
      ok: false,
      error: message,
      path: args.path,
    });
  }
}
