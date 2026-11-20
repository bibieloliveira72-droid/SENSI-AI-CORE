import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app.js";
import { validateSensiPayload, normalizeSensitivityResponse } from "../src/validation.js";
import { generateSensitivity } from "../src/geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, "../../frontend");

async function startTestServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

test("Frontend e assets Android não contêm chaves secretas nem referências a Gemini API key", () => {
  const dirs = [
    FRONTEND_DIR,
    path.resolve(__dirname, "../../app/src/main/assets/web"),
  ];

  for (const dir of dirs) {
    assert.ok(fs.existsSync(dir), `Diretório ausente: ${dir}`);
    const files = fs.readdirSync(dir);
    assert.ok(files.includes("index.html"));
    assert.ok(files.includes("styles.css"));
    assert.ok(files.includes("app.js"));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (!fs.statSync(fullPath).isFile()) continue;
      const content = fs.readFileSync(fullPath, "utf8");
      assert.equal(/AIza[0-9A-Za-z\-_]{20,}/.test(content), false, `Possível chave Google em ${file}`);
      assert.equal(/process\.env/.test(content), false, `process.env encontrado em ${file}`);
      assert.equal(/@google\/genai/.test(content), false, `SDK do backend encontrado em ${file}`);
      assert.equal(/x-goog-api-key/i.test(content), false, `Header de chave encontrado em ${file}`);
    }
  }
});

test("validateSensiPayload valida corretamente campos válidos e rejeita inválidos", () => {
  const valid = validateSensiPayload({
    marca: "Samsung",
    modelo: "Galaxy S23",
    ram: "8 GB",
    taxaAtualizacao: "120Hz",
    dpi: 600,
    estiloJogo: "Rush Agressivo",
    preferenciaMira: "Subir capa rápido",
  });
  assert.equal(valid.ok, true);
  assert.deepEqual(valid.data, {
    marca: "Samsung",
    modelo: "Galaxy S23",
    ram: 8,
    taxaAtualizacao: 120,
    dpi: 600,
    estiloJogo: "Rush Agressivo",
    preferenciaMira: "Subir capa rápido",
  });

  const invalidDpi = validateSensiPayload({
    marca: "Samsung",
    modelo: "Galaxy S23",
    ram: 8,
    taxaAtualizacao: 120,
    dpi: 9999,
    estiloJogo: "Rush",
    preferenciaMira: "Capa",
  });
  assert.equal(invalidDpi.ok, false);
  assert.ok(invalidDpi.errors.some((e) => e.includes("DPI")));
});

test("normalizeSensitivityResponse garante as 6 chaves obrigatórias entre 0 e 200", () => {
  const normalized = normalizeSensitivityResponse({
    General: 188,
    "Red Dot": 175,
    "2x": 162,
    "4x": 149,
    AWM: 94,
    Olhadinha: 140,
    observacoes: "Teste no treinamento antes de ranqueada.",
  });

  assert.equal(normalized.General, 188);
  assert.equal(normalized["Red Dot"], 175);
  assert.equal(normalized["2x"], 162);
  assert.equal(normalized["4x"], 149);
  assert.equal(normalized.AWM, 94);
  assert.equal(normalized.Olhadinha, 140);
  assert.match(normalized.aviso, /sugest/i);

  assert.throws(() => normalizeSensitivityResponse({ General: 250 }));
});

test("POST /api/sensi rejeita entradas inválidas e JSON malformado com HTTP 400", async () => {
  const app = createApp({ serveFrontend: false });
  const { server, baseUrl } = await startTestServer(app);

  try {
    const emptyRes = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(emptyRes.status, 400);
    const emptyJson = await emptyRes.json();
    assert.equal(emptyJson.code, "VALIDATION_ERROR");

    const badJsonRes = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalido",
    });
    assert.equal(badJsonRes.status, 400);
    const badJson = await badJsonRes.json();
    assert.equal(badJson.code, "INVALID_JSON");
  } finally {
    server.close();
  }
});

test("CORS permite requisições de aplicativos Android (Origin null e appassets)", async () => {
  const app = createApp({ serveFrontend: false });
  const { server, baseUrl } = await startTestServer(app);

  try {
    const preflightNull = await fetch(`${baseUrl}/api/sensi`, {
      method: "OPTIONS",
      headers: {
        Origin: "null",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    assert.ok(preflightNull.status === 200 || preflightNull.status === 204);
    assert.ok(preflightNull.headers.get("access-control-allow-origin"));

    const preflightWebView = await fetch(`${baseUrl}/api/sensi`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://appassets.androidplatform.net",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    assert.ok(preflightWebView.status === 200 || preflightWebView.status === 204);
    assert.equal(
      preflightWebView.headers.get("access-control-allow-origin"),
      "https://appassets.androidplatform.net"
    );
  } finally {
    server.close();
  }
});

test("Rate limit bloqueia excesso de requisições com HTTP 429", async () => {
  const app = createApp({
    serveFrontend: false,
    rateLimitMax: 2,
    rateLimitWindowMs: 60000,
    generateSensitivityFn: async () =>
      normalizeSensitivityResponse({
        General: 180,
        "Red Dot": 170,
        "2x": 160,
        "4x": 150,
        AWM: 90,
        Olhadinha: 130,
        observacoes: "Teste de rate limit.",
      }),
  });
  const { server, baseUrl } = await startTestServer(app);

  const payload = {
    marca: "Xiaomi",
    modelo: "Poco X6 Pro",
    ram: 12,
    taxaAtualizacao: 120,
    dpi: 600,
    estiloJogo: "Rush Agressivo",
    preferenciaMira: "Subir capa rápido",
  };

  try {
    const r1 = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(r1.status, 200);

    const r2 = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(r2.status, 200);

    const r3 = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    assert.equal(r3.status, 429);
    const json3 = await r3.json();
    assert.equal(json3.code, "RATE_LIMIT_EXCEEDED");
  } finally {
    server.close();
  }
});

test("Sem GEMINI_API_KEY retorna 503 sem resposta simulada e sem vazar segredos", async () => {
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const app = createApp({ serveFrontend: false });
  const { server, baseUrl } = await startTestServer(app);

  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.geminiConfigured, false);
    assert.equal("GEMINI_API_KEY" in healthJson, false);

    const sensiRes = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marca: "Motorola",
        modelo: "Moto G84",
        ram: 8,
        taxaAtualizacao: 120,
        dpi: 520,
        estiloJogo: "Equilibrado",
        preferenciaMira: "Controle de recuo estável",
      }),
    });
    assert.equal(sensiRes.status, 503);
    const sensiJson = await sensiRes.json();
    assert.equal(sensiJson.code, "ServiceConfigError");
    assert.equal("General" in sensiJson, false);
  } finally {
    server.close();
    if (prevKey !== undefined) process.env.GEMINI_API_KEY = prevKey;
  }
});

test("Conexão real com @google/genai quando GEMINI_API_KEY está configurada", async (t) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    t.skip(
      "GEMINI_API_KEY não definida no ambiente atual; teste ao vivo com Gemini pulado."
    );
    return;
  }

  const app = createApp({
    serveFrontend: false,
    generateSensitivityFn: generateSensitivity,
  });
  const { server, baseUrl } = await startTestServer(app);

  try {
    const res = await fetch(`${baseUrl}/api/sensi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marca: "Samsung",
        modelo: "Galaxy S23",
        ram: 8,
        taxaAtualizacao: 120,
        dpi: 600,
        estiloJogo: "Rush Agressivo",
        preferenciaMira: "Subir capa rápido",
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    for (const key of ["General", "Red Dot", "2x", "4x", "AWM", "Olhadinha"]) {
      assert.equal(Number.isInteger(data[key]), true, `Campo ${key} deve ser inteiro`);
      assert.ok(data[key] >= 0 && data[key] <= 200, `Campo ${key} fora do intervalo 0..200`);
    }
    assert.equal(typeof data.observacoes, "string");
    assert.equal(typeof data.aviso, "string");
  } finally {
    server.close();
  }
});
