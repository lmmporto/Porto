import { runAgent } from "./agent.js";

async function main() {
  const userMessage = process.argv.slice(2).join(" ").trim();

  if (!userMessage) {
    console.log('Use: pnpm dev -- "sua instrução aqui"');
    process.exit(1);
  }

  console.log(`User: ${userMessage}\n`);

  try {
    const response = await runAgent(userMessage);
    console.log(`Assistant: ${response}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Erro:", message);
    process.exit(1);
  }
}

main();
