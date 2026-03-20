import path from "node:path";

const openaiApiKey = process.env.OPENAI_API_KEY ?? "";
const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const projectRoot = path.resolve(process.cwd(), "..");

export const config = {
  openaiApiKey,
  model,
  maxIterations: 8,
  projectRoot,
  maxFileBytes: 300_000,
  allowedCommandPrefixes: [
    "npm test",
    "npm run test",
    "npm run build",
    "npm run lint",
    "npm run dev",
    "node --check",
    "tsc --noEmit",
  ],
};

if (!config.openaiApiKey) {
  throw new Error(
    "OPENAI_API_KEY environment variable is required. Add it to your environment.",
  );
}
