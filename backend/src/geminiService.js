import { GoogleGenAI, Type } from "@google/genai";
import { normalizeSensitivityResponse } from "./validation.js";

export class ServiceConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServiceConfigError";
    this.statusCode = 503;
  }
}

export class GeminiUpstreamError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "GeminiUpstreamError";
    this.statusCode = statusCode;
  }
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    General: {
      type: Type.INTEGER,
      description: "Sensibilidade Geral (0 a 200)",
    },
    "Red Dot": {
      type: Type.INTEGER,
      description: "Sensibilidade Ponto Vermelho / Red Dot (0 a 200)",
    },
    "2x": {
      type: Type.INTEGER,
      description: "Sensibilidade Mira 2x (0 a 200)",
    },
    "4x": {
      type: Type.INTEGER,
      description: "Sensibilidade Mira 4x (0 a 200)",
    },
    AWM: {
      type: Type.INTEGER,
      description: "Sensibilidade Mira AWM / Sniper (0 a 200)",
    },
    Olhadinha: {
      type: Type.INTEGER,
      description: "Sensibilidade Olhadinha / Câmera livre (0 a 200)",
    },
    observacoes: {
      type: Type.STRING,
      description: "Dica breve e prática de calibração em português (máx. 280 caracteres)",
    },
  },
  required: [
    "General",
    "Red Dot",
    "2x",
    "4x",
    "AWM",
    "Olhadinha",
    "observacoes",
  ],
};

function buildPrompt(profile) {
  return [
    "Calcule uma configuração inicial recomendada de sensibilidade mobile (escala 0 a 200, padrão atual competitivo) para o seguinte perfil:",
    `- Marca: ${profile.marca}`,
    `- Modelo: ${profile.modelo}`,
    `- Memória RAM: ${profile.ram} GB`,
    `- Taxa de atualização da tela: ${profile.taxaAtualizacao} Hz`,
    `- DPI configurada: ${profile.dpi}`,
    `- Estilo de jogo: ${profile.estiloJogo}`,
    `- Preferência de mira: ${profile.preferenciaMira}`,
    "",
    "Considere o impacto real de DPI alta/baixa, taxa de amostragem/Hz da tela e estabilidade de quadros pela RAM.",
    "Retorne exclusivamente JSON válido seguindo o schema solicitado, com números inteiros entre 0 e 200 e uma observação objetiva em português indicando que é um ponto de partida para ajuste fino.",
  ].join("\n");
}

function sanitizeErrorMessage(error) {
  const apiKey = process.env.GEMINI_API_KEY;
  let msg = error instanceof Error ? error.message : String(error ?? "");
  if (apiKey && apiKey.length > 4) {
    msg = msg.split(apiKey).join("[REDACTED]");
  }
  return msg;
}

export async function generateSensitivity(profile, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new ServiceConfigError(
      "Chave GEMINI_API_KEY não configurada no servidor backend."
    );
  }

  const model = options.model || process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const ai = options.aiClient || new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildPrompt(profile),
      config: {
        systemInstruction:
          "Você é o motor técnico do SENSI.AI, especialista em calibração de sensibilidade mobile para jogos de tiro em terceira pessoa. Nunca prometa resultados garantidos; forneça pontos de partida coerentes com DPI, Hz, hardware e estilo do jogador.",
        temperature: 0.35,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const rawText = typeof response?.text === "string" ? response.text.trim() : "";
    if (!rawText) {
      throw new GeminiUpstreamError(
        "O modelo Gemini retornou uma resposta vazia."
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new GeminiUpstreamError(
        "O modelo Gemini retornou um formato inválido que não pôde ser interpretado como JSON."
      );
    }

    return normalizeSensitivityResponse(parsed);
  } catch (error) {
    if (error instanceof ServiceConfigError || error instanceof GeminiUpstreamError) {
      throw error;
    }

    const cleanMsg = sanitizeErrorMessage(error);
    const status =
      typeof error?.status === "number"
        ? error.status
        : typeof error?.statusCode === "number"
          ? error.statusCode
          : 502;

    if (status === 429) {
      throw new GeminiUpstreamError(
        "Limite de cota da API Gemini atingido no momento. Tente novamente em instantes.",
        429
      );
    }

    if (status === 401 || status === 403 || /api key/i.test(cleanMsg)) {
      throw new GeminiUpstreamError(
        "Falha de autenticação com a API Gemini no servidor. Verifique a variável GEMINI_API_KEY.",
        502
      );
    }

    throw new GeminiUpstreamError(
      "Não foi possível gerar a sensibilidade com o Gemini no momento.",
      502
    );
  }
}
