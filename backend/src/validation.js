const SENSITIVITY_KEYS = [
  "General",
  "Red Dot",
  "2x",
  "4x",
  "AWM",
  "Olhadinha",
];

function sanitizeText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}

function parsePositiveInt(value, unitPattern) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace(unitPattern, "").trim();
    if (/^\d{1,5}$/.test(cleaned)) {
      return Number.parseInt(cleaned, 10);
    }
  }
  return Number.NaN;
}

export function validateSensiPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      errors: ["O corpo da requisição deve ser um objeto JSON válido."],
    };
  }

  const errors = [];

  const marca = sanitizeText(body.marca ?? body.brand, 50);
  const modelo = sanitizeText(body.modelo ?? body.model, 60);
  const ram = parsePositiveInt(body.ram, /gb$/i);
  const taxaAtualizacao = parsePositiveInt(
    body.taxaAtualizacao ?? body.taxa_atualizacao ?? body.refreshRate,
    /hz$/i
  );
  const dpi = parsePositiveInt(body.dpi, /dpi$/i);
  const estiloJogo = sanitizeText(
    body.estiloJogo ?? body.estilo_jogo ?? body.playstyle,
    60
  );
  const preferenciaMira = sanitizeText(
    body.preferenciaMira ?? body.preferencia_mira ?? body.aimPreference,
    80
  );

  if (marca.length < 2) {
    errors.push("Informe a marca do smartphone (mínimo de 2 caracteres).");
  }
  if (modelo.length < 1) {
    errors.push("Informe o modelo do smartphone.");
  }
  if (!Number.isInteger(ram) || ram < 1 || ram > 64) {
    errors.push("A memória RAM deve ser um número inteiro entre 1 e 64 GB.");
  }
  if (!Number.isInteger(taxaAtualizacao) || taxaAtualizacao < 30 || taxaAtualizacao > 240) {
    errors.push("A taxa de atualização deve estar entre 30 e 240 Hz.");
  }
  if (!Number.isInteger(dpi) || dpi < 100 || dpi > 2000) {
    errors.push("A DPI deve ser um número inteiro entre 100 e 2000.");
  }
  if (estiloJogo.length < 2) {
    errors.push("Selecione ou informe o estilo de jogo.");
  }
  if (preferenciaMira.length < 2) {
    errors.push("Selecione ou informe a preferência de mira.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      marca,
      modelo,
      ram,
      taxaAtualizacao,
      dpi,
      estiloJogo,
      preferenciaMira,
    },
  };
}

export function normalizeSensitivityResponse(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("A resposta da IA não é um objeto JSON válido.");
  }

  const normalized = {};
  for (const key of SENSITIVITY_KEYS) {
    const rawValue = raw[key];
    const parsed =
      typeof rawValue === "number"
        ? Math.round(rawValue)
        : typeof rawValue === "string" && /^\d{1,3}$/.test(rawValue.trim())
          ? Number.parseInt(rawValue.trim(), 10)
          : Number.NaN;

    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 200) {
      throw new Error(`Valor inválido retornado para "${key}".`);
    }
    normalized[key] = parsed;
  }

  const observacoes =
    typeof raw.observacoes === "string" && raw.observacoes.trim().length > 0
      ? raw.observacoes.trim().slice(0, 400)
      : "Ajuste em incrementos de 2 a 5 pontos no modo treinamento até estabilizar a puxada.";

  return {
    ...normalized,
    observacoes,
    aviso:
      "Sugestão inicial gerada por IA com base no seu dispositivo e estilo. Não são valores garantidos; faça ajustes finos conforme película, toque e memória muscular.",
  };
}

export { SENSITIVITY_KEYS };
