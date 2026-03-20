import OpenAI from "openai";
import { config } from "./config.js";
import { systemPrompt } from "./prompts/systemPrompt.js";
import { listFilesTool, handleListFiles } from "./tools/listFiles.js";
import { readFileTool, handleReadFile } from "./tools/readFile.js";
import { searchCodeTool, handleSearchCode } from "./tools/searchCode.js";

const client = new OpenAI({
  apiKey: config.openaiApiKey,
});

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  listFilesTool,
  readFileTool,
  searchCodeTool,
];

export async function runAgent(userMessage: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < config.maxIterations; i++) {
    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      tools,
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;

    if (!message) {
      throw new Error("Modelo não retornou mensagem.");
    }

    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return String(message.content || "Sem resposta.");
    }

    for (const toolCall of message.tool_calls) {
      const toolName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");

      let result = "";

      if (toolName === "list_files") {
        result = await handleListFiles(args);
      } else if (toolName === "read_file") {
        result = await handleReadFile(args);
      } else if (toolName === "search_code") {
        result = await handleSearchCode(args);
      } else {
        result = JSON.stringify({
          ok: false,
          error: `Tool desconhecida: ${toolName}`,
        });
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result,
      });
    }
  }

  throw new Error("Número máximo de iterações atingido.");
}
