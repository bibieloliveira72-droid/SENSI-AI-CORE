import "dotenv/config";
import { createApp } from "./app.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = createApp();

app.listen(PORT, HOST, () => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  console.log(`[SENSI.AI] Servidor ativo em http://${HOST}:${PORT}`);
  console.log(
    `[SENSI.AI] GEMINI_API_KEY: ${hasKey ? "configurada" : "NÃO configurada (defina no ambiente ou .env)"}`
  );
});
