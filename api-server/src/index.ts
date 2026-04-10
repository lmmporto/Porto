import app from "./app.js";
import { startWorker } from "./services/worker.service.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log("=================================");
  console.log("🚀 SERVER STARTED");
  console.log(`🌐 Listening on port: ${port}`);
  console.log("=================================");
  
  // 🚩 LIGA O MOTOR DE PROCESSAMENTO EM BACKGROUND
//  startWorker();
});