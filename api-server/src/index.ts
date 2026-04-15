import app from "./app.js";
import { startWorker } from "./services/worker.service.js";

const port = Number(process.env.PORT) || 3000;

// 🏛️ ARQUITETO: Adicionamos ouvintes globais para evitar que o 502 aconteça por erros bobos
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
  // Não matamos o processo imediatamente para o Render não dar 502 instantâneo
});

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 SERVER ONLINE NA PORTA ${port}`);
  
  // O Worker só inicia se o servidor estiver de pé
  try {
    if (typeof startWorker === "function") {
      startWorker();
      console.log("👷 Worker iniciado.");
    }
  } catch (e) {
    console.error("❌ Falha ao iniciar Worker, mas o servidor continuará de pé.");
  }
});