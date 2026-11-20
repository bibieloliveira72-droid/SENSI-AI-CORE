import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { validateSensiPayload } from "./validation.js";
import {
  generateSensitivity,
  ServiceConfigError,
  GeminiUpstreamError,
} from "./geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, "../../frontend");

function buildCorsOptions() {
  const rawOrigin = (process.env.CORS_ORIGIN || "*").trim();
  const allowedList =
    rawOrigin === "*"
      ? null
      : rawOrigin
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  return {
    origin(origin, callback) {
      // Requisições nativas Android, WebView file:// ("null") e ferramentas sem Origin
      if (!origin || origin === "null") {
        return callback(null, true);
      }

      if (!allowedList) {
        return callback(null, true);
      }

      const androidAllowed = [
        "https://appassets.androidplatform.net",
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
      ];

      if (allowedList.includes(origin) || androidAllowed.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origem não permitida pela política CORS."));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: false,
    maxAge: 86400,
  };
}

export function createApp(options = {}) {
  const app = express();
  const generateFn = options.generateSensitivityFn || generateSensitivity;
  const windowMs =
    options.rateLimitWindowMs ??
    (Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000);
  const maxRequests =
    options.rateLimitMax ??
    (Number.parseInt(process.env.RATE_LIMIT_MAX || "15", 10) || 15);

  app.disable("x-powered-by");

  const corsMiddleware = cors(buildCorsOptions());
  app.use(corsMiddleware);
  app.options("*", corsMiddleware);

  app.use(express.json({ limit: "16kb" }));

  const sensiLimiter = rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler(_req, res) {
      res.status(429).json({
        error: "Muitas requisições enviadas. Aguarde alguns segundos antes de gerar novamente.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    },
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "SENSI.AI",
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.post("/api/sensi", sensiLimiter, async (req, res, next) => {
    try {
      const validation = validateSensiPayload(req.body);
      if (!validation.ok) {
        return res.status(400).json({
          error: validation.errors[0],
          errors: validation.errors,
          code: "VALIDATION_ERROR",
        });
      }

      const result = await generateFn(validation.data);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  });

  if (options.serveFrontend !== false && fs.existsSync(FRONTEND_DIR)) {
    app.use(express.static(FRONTEND_DIR));
    app.get("/", (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIR, "index.html"));
    });
  }

  app.use("/api/*", (_req, res) => {
    res.status(404).json({
      error: "Rota da API não encontrada.",
      code: "NOT_FOUND",
    });
  });

  // Tratamento centralizado de erros sem expor segredos ou stack traces
  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      return res.status(400).json({
        error: "JSON malformado no corpo da requisição.",
        code: "INVALID_JSON",
      });
    }

    if (err?.type === "entity.too.large") {
      return res.status(413).json({
        error: "Tamanho da requisição excedido.",
        code: "PAYLOAD_TOO_LARGE",
      });
    }

    if (err?.message?.includes("CORS")) {
      return res.status(403).json({
        error: "Origem não autorizada pelo CORS.",
        code: "CORS_FORBIDDEN",
      });
    }

    if (err instanceof ServiceConfigError || err instanceof GeminiUpstreamError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.name,
      });
    }

    return res.status(500).json({
      error: "Erro interno inesperado no servidor SENSI.AI.",
      code: "INTERNAL_ERROR",
    });
  });

  return app;
}
