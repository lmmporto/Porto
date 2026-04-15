import app from "./app.js";
import { startWorker } from "./services/worker.service.js";

const port = Number(process.env.PORT) || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("=================================");
  console.log(" SERVER STARTED");
  console.log(` Listening on host: 0.0.0.0`);
  console.log(` Port: ${port}`);
  console.log("=================================");

  if (typeof startWorker === "function") startWorker();
});
