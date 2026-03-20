import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import { config } from "../config.js";

export const searchCodeTool: OpenAI.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "search_code",
    description: "Busca texto em arquivos de código dentro do projeto",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Texto a procurar no código",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
};

async function walk(dir: string, acc: string[]) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      ["node_modules", ".git", "dist", "build", ".next", ".turbo", ".cache"].includes(
        entry.name,
      )
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(fullPath, acc);
    } else {
      acc.push(fullPath);
    }
  }
}

export async function handleSearchCode(args: { query: string }): Promise<string> {
  try {
    const query = String(args.query || "").trim();

    if (!query) {
      return JSON.stringify({
        ok: false,
        error: "Query não informada.",
      });
    }

    const files: string[] = [];
    await walk(config.projectRoot, files);

    const matches: Array<{ path: string; line: number; snippet: string }> = [];

    for (const file of files) {
      try {
        const stat = await fs.stat(file);
        if (stat.size > config.maxFileBytes) continue;

        const content = await fs.readFile(file, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            matches.push({
              path: path.relative(config.projectRoot, file),
              line: index + 1,
              snippet: line.trim(),
            });
          }
        });
      } catch {
      }
    }

    return JSON.stringify({
      ok: true,
      query,
      matches: matches.slice(0, 50),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    return JSON.stringify({
      ok: false,
      error: message,
    });
  }
}
