((root) => {
  "use strict";

  const SCOPE_KEYS = ["General", "Red Dot", "2x", "4x", "AWM", "Olhadinha"];
  const MIN_SENSI = 0;
  const MAX_SENSI = 200;

  const PROFILES = {
    capa: {
      id: "capa",
      label: "Capa",
      subtitle: "Puxada vertical ágil e controle de cabeça",
      bases: {
        General: 176,
        "Red Dot": 172,
        "2x": 158,
        "4x": 142,
        AWM: 88,
        Olhadinha: 148,
      },
      dpiWeights: {
        General: 0.088,
        "Red Dot": 0.082,
        "2x": 0.068,
        "4x": 0.056,
        AWM: 0.036,
        Olhadinha: 0.078,
      },
    },
    precisao: {
      id: "precisao",
      label: "Precisão",
      subtitle: "Menor tremor e rastreio firme à média/longa distância",
      bases: {
        General: 158,
        "Red Dot": 152,
        "2x": 144,
        "4x": 134,
        AWM: 82,
        Olhadinha: 132,
      },
      dpiWeights: {
        General: 0.074,
        "Red Dot": 0.068,
        "2x": 0.058,
        "4x": 0.048,
        AWM: 0.030,
        Olhadinha: 0.064,
      },
    },
    equilibrado: {
      id: "equilibrado",
      label: "Equilibrado",
      subtitle: "Versátil para trocação curta, média e rotação",
      bases: {
        General: 168,
        "Red Dot": 162,
        "2x": 150,
        "4x": 138,
        AWM: 86,
        Olhadinha: 142,
      },
      dpiWeights: {
        General: 0.080,
        "Red Dot": 0.074,
        "2x": 0.062,
        "4x": 0.052,
        AWM: 0.033,
        Olhadinha: 0.070,
      },
    },
    agressivo: {
      id: "agressivo",
      label: "Agressivo",
      subtitle: "Movimentação rápida, gelo ágil e rush de curta distância",
      bases: {
        General: 186,
        "Red Dot": 176,
        "2x": 162,
        "4x": 144,
        AWM: 94,
        Olhadinha: 166,
      },
      dpiWeights: {
        General: 0.092,
        "Red Dot": 0.084,
        "2x": 0.070,
        "4x": 0.056,
        AWM: 0.038,
        Olhadinha: 0.086,
      },
    },
  };

  const PROCESSOR_TIERS = {
    flagship: {
      id: "flagship",
      label: "Topo de linha (Snapdragon 8 / Dimensity 9000+ / Apple A)",
      responsiveness: -2,
      stability: 2,
    },
    intermediario_plus: {
      id: "intermediario_plus",
      label: "Intermediário Premium (Snapdragon 7 / Dimensity 8000 / Exynos 1380+)",
      responsiveness: 0,
      stability: 1,
    },
    intermediario: {
      id: "intermediario",
      label: "Intermediário (Snapdragon 6 / Helio G99 / Dimensity 6000)",
      responsiveness: 3,
      stability: -1,
    },
    entrada: {
      id: "entrada",
      label: "Básico / Entrada (Helio G85 ou inferior / Quad-Core)",
      responsiveness: 6,
      stability: -3,
    },
  };

  const BRAND_TOUCH_CURVES = {
    "asus rog": { touchGain: -4, scopeControl: 2 },
    rog: { touchGain: -4, scopeControl: 2 },
    redmagic: { touchGain: -4, scopeControl: 2 },
    apple: { touchGain: -3, scopeControl: 3 },
    iphone: { touchGain: -3, scopeControl: 3 },
    xiaomi: { touchGain: -1, scopeControl: 1 },
    poco: { touchGain: -2, scopeControl: 1 },
    redmi: { touchGain: 1, scopeControl: 0 },
    samsung: { touchGain: 2, scopeControl: 0 },
    motorola: { touchGain: 3, scopeControl: -1 },
    realme: { touchGain: 1, scopeControl: 0 },
    infinix: { touchGain: 3, scopeControl: -1 },
    oneplus: { touchGain: -2, scopeControl: 2 },
  };

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, Math.round(num)));
  }

  function sanitizeNumber(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
  }

  function resolveBrandCurve(marca, modelo) {
    const combined = `${String(marca || "")} ${String(modelo || "")}`.toLowerCase();
    for (const [key, curve] of Object.entries(BRAND_TOUCH_CURVES)) {
      if (combined.includes(key)) {
        return curve;
      }
    }
    return { touchGain: 2, scopeControl: 0 };
  }

  function resolveModelSignatureOffset(modelo) {
    // Assinatura determinística baseada nos caracteres do modelo (entre -2 e +2, sem aleatoriedade)
    const text = String(modelo || "").trim().toLowerCase();
    if (!text) return 0;
    let acc = 0;
    for (let i = 0; i < text.length; i += 1) {
      acc += text.charCodeAt(i) * (i + 1);
    }
    return (acc % 5) - 2;
  }

  function resolveProcessorTier(tierId, customProcessorText) {
    if (PROCESSOR_TIERS[tierId]) {
      return PROCESSOR_TIERS[tierId];
    }
    const text = String(customProcessorText || "").toLowerCase();
    if (/(snapdragon\s*8|gen\s*[1234]|dimensity\s*9|a1[56789]|m[1234])/.test(text)) {
      return PROCESSOR_TIERS.flagship;
    }
    if (/(snapdragon\s*7|dimensity\s*[78]|exynos\s*1[34])/.test(text)) {
      return PROCESSOR_TIERS.intermediario_plus;
    }
    if (/(snapdragon\s*6|helio\s*g9|dimensity\s*6)/.test(text)) {
      return PROCESSOR_TIERS.intermediario;
    }
    return PROCESSOR_TIERS.intermediario;
  }

  function normalizeInput(rawInput) {
    const input = rawInput && typeof rawInput === "object" ? rawInput : {};
    const marca = String(input.marca || "Outro").trim().slice(0, 50) || "Outro";
    const modelo = String(input.modelo || "Padrão").trim().slice(0, 60) || "Padrão";
    const processadorTier = PROCESSOR_TIERS[input.processador]
      ? input.processador
      : "intermediario_plus";
    const processadorDetalhe = String(input.processadorDetalhe || "").trim().slice(0, 60);
    const ram = sanitizeNumber(input.ram, 8, 1, 32);
    const dpi = sanitizeNumber(input.dpi, 600, 200, 1600);
    const hz = sanitizeNumber(input.hz, 120, 60, 165);
    const fireButtonSize = sanitizeNumber(input.fireButtonSize, 52, 25, 90);
    const profileKey = PROFILES[input.profile] ? input.profile : "capa";
    const engineMode = ["controle", "balanceado", "agil"].includes(input.engineMode) ? input.engineMode : "balanceado";

    return {
      marca,
      modelo,
      processador: processadorTier,
      processadorDetalhe,
      ram,
      dpi,
      hz,
      fireButtonSize,
      profile: profileKey,
      engineMode,
    };
  }

  function recommendDisplaySetup(cfg) {
    const tier = cfg.processador || "intermediario";
    const ram = sanitizeNumber(cfg.ram, 8, 1, 32);
    let resolution = "960 × 720";
    let resolutionLabel = "Esticada 4:3 · leve";
    let dpi = 420;
    let reason = "Perfil 4:3 de menor carga, indicado como ponto de partida para aparelhos de entrada.";

    if (tier === "flagship" && ram >= 8) {
      resolution = "1440 × 1080";
      resolutionLabel = "Esticada 4:3 · alta";
      dpi = 560;
      reason = "Perfil 4:3 de maior definição para aparelhos de alto desempenho.";
    } else if ((tier === "intermediario_plus" && ram >= 6) || (tier === "flagship" && ram < 8)) {
      resolution = "1280 × 960";
      resolutionLabel = "Esticada 4:3 · média";
      dpi = 500;
      reason = "Perfil 4:3 intermediário, buscando equilibrar definição e fluidez.";
    } else if (tier === "intermediario" && ram >= 6) {
      resolution = "1280 × 960";
      resolutionLabel = "Esticada 4:3 · média";
      dpi = 480;
      reason = "Perfil 4:3 intermediário; reduza a carga gráfica se houver perda de fluidez.";
    }

    return {
      resolution,
      resolutionLabel,
      dpi,
      reason,
      note: "Prioridade para proporção esticada 4:3, não para a proporção original da tela. A imagem pode ficar deformada ou cortada e nem todo jogo/aparelho aceita essas dimensões. É apenas uma recomendação: não altera o Android automaticamente."
    };
  }

  function generateSensitivity(rawInput) {
    const cfg = normalizeInput(rawInput);
    const profile = PROFILES[cfg.profile];

    // Hardware descreve desempenho e fluidez, não mede diretamente a resposta do toque.
    // Por isso, apenas DPI e tamanho do botão entram na sugestão inicial de sensibilidade.
    const dpiDelta = 450 - cfg.dpi;
    const smoothDpiDelta = Math.tanh(dpiDelta / 380) * 380;
    const buttonDelta = (cfg.fireButtonSize - 52) * 0.36;
    const values = {};
    const modeWeights = { controle: { General: -3, "Red Dot": -2, "2x": -3, "4x": -4, AWM: -3, Olhadinha: -2 }, balanceado: { General: 0, "Red Dot": 0, "2x": 0, "4x": 0, AWM: 0, Olhadinha: 0 }, agil: { General: 3, "Red Dot": 2, "2x": 2, "4x": 1, AWM: 1, Olhadinha: 4 } }[cfg.engineMode];

    for (const scope of SCOPE_KEYS) {
      const dpiAdjustment = smoothDpiDelta * profile.dpiWeights[scope];
      const buttonWeight = scope === "General" ? 0.95
        : scope === "Red Dot" ? 1.05
        : scope === "2x" ? 0.55
        : scope === "4x" ? 0.30
        : scope === "AWM" ? 0.12
        : 0.95;
      values[scope] = clamp(
        profile.bases[scope] + dpiAdjustment + buttonDelta * buttonWeight + modeWeights[scope],
        MIN_SENSI,
        MAX_SENSI
      );
    }

    const insights = buildTechnicalNotes(cfg, values);
    return {
      config: cfg,
      recommendations: recommendDisplaySetup(cfg),
      profileLabel: profile.label,
      engineMode: cfg.engineMode,
      values,
      notes: insights.concat(["Modo híbrido 2.0: " + cfg.engineMode + " combinado ao perfil " + profile.label + "."]),
      disclaimer:
        "Sugestão inicial local para testes no modo treinamento. Hardware não determina a sensibilidade do toque; ajuste os valores conforme sua resposta real. O SENSI.AI não promete mira automática ou capa garantida.",
    };
  }

  function buildTechnicalNotes(cfg, values) {
    const tips = [];

    if (cfg.dpi >= 800) {
      tips.push(`DPI alta (${cfg.dpi}) detectada: a sugestão inicial foi ajustada pela curva de DPI. Valide o resultado no treinamento.`);
    } else if (cfg.dpi <= 420) {
      tips.push(`DPI baixa/padrão (${cfg.dpi}): a curva de DPI ajustou a sugestão inicial. Valide o resultado no treinamento.`);
    } else {
      tips.push(`DPI intermediária (${cfg.dpi}) aplicada à sugestão inicial.`);
    }

    if (cfg.fireButtonSize >= 65) {
      tips.push(`Botão de tiro grande (${cfg.fireButtonSize}%): o tamanho foi considerado como preferência de configuração. Teste pequenas alterações para encontrar seu conforto.`);
    } else if (cfg.fireButtonSize <= 42) {
      tips.push(`Botão de tiro compacto (${cfg.fireButtonSize}%): o tamanho foi considerado como preferência de configuração.`);
    }

    tips.push("Chipset, RAM e Hz são informações de desempenho do aparelho; não são usados como medida direta da sensibilidade do toque.");
    return tips;
  }

  function adjustSingleScope(currentValues, scopeKey, delta) {
    if (!SCOPE_KEYS.includes(scopeKey)) {
      throw new Error(`Mira inválida: ${scopeKey}`);
    }
    const next = { ...currentValues };
    const prevVal = sanitizeNumber(next[scopeKey], 100, MIN_SENSI, MAX_SENSI);
    const step = Number.isFinite(Number(delta)) ? Math.trunc(Number(delta)) : 0;
    next[scopeKey] = clamp(prevVal + step, MIN_SENSI, MAX_SENSI);
    return next;
  }

  function applyAdaptiveCalibration(currentValues, feedbackType, context = {}) {
    const prev = {};
    for (const key of SCOPE_KEYS) {
      prev[key] = sanitizeNumber(currentValues?.[key], 100, MIN_SENSI, MAX_SENSI);
    }

    const dpi = sanitizeNumber(context.dpi, 600, 200, 1600);
    const fireButtonSize = sanitizeNumber(context.fireButtonSize, 52, 25, 90);
    const iteration = sanitizeNumber(context.calibrationSteps, 0, 0, 20);

    // Passo adaptativo amortecido: primeiras calibrações corrigem mais; repetições refinam mais fino
    const damping = Math.max(0.5, 1 - iteration * 0.1);
    const dpiGain = dpi >= 750 ? 0.85 : dpi <= 420 ? 1.15 : 1.0;

    const memoryInput = context.learningState && typeof context.learningState === "object"
      ? context.learningState : {};
    const rawDeltas = {
      General: 0,
      "Red Dot": 0,
      "2x": 0,
      "4x": 0,
      AWM: 0,
      Olhadinha: 0,
    };

    let reason = "";
    let tip = "";

    switch (feedbackType) {
      case "overshoot_head": {
        rawDeltas.General = -Math.max(2, Math.round(5 * damping * dpiGain));
        rawDeltas["Red Dot"] = -Math.max(2, Math.round(6 * damping * dpiGain));
        rawDeltas["2x"] = -Math.max(1, Math.round(3 * damping));
        reason = "Mira passando acima da cabeça";
        tip =
          "Reduzimos General, Red Dot e 2x para diminuir o excesso na puxada inicial.";
        break;
      }
      case "stuck_chest": {
        const buttonBoost = fireButtonSize >= 65 ? 1.2 : 1.0;
        rawDeltas.General = Math.max(2, Math.round(6 * damping * buttonBoost));
        rawDeltas["Red Dot"] = Math.max(2, Math.round(7 * damping * buttonBoost));
        rawDeltas["2x"] = Math.max(1, Math.round(4 * damping));
        reason = "Mira pesada / travando no peito";
        tip =
          fireButtonSize >= 65
            ? "Aumentamos a resposta vertical. Dica: diminuir um pouco o botão de tiro também amplia o espaço de arraste."
            : "Aumentamos a resposta vertical em General, Red Dot e 2x para facilitar o descolamento.";
        break;
      }
      case "scope_shake": {
        rawDeltas["2x"] = -Math.max(2, Math.round(5 * damping));
        rawDeltas["4x"] = -Math.max(2, Math.round(7 * damping));
        reason = "Miras 2x e 4x tremendo à distância";
        tip =
          "Estabilizamos as miras de médio/longo alcance sem alterar sua movimentação geral.";
        break;
      }
      case "slow_turn": {
        rawDeltas.General = Math.max(2, Math.round(6 * damping));
        rawDeltas.Olhadinha = Math.max(3, Math.round(8 * damping));
        reason = "Movimentação e giro de gelo lentos";
        tip =
          "Elevamos General e Olhadinha para agilizar giros de câmera e posicionamento.";
        break;
      }
      case "awm_slow": {
        rawDeltas.AWM = Math.max(2, Math.round(6 * damping));
        reason = "Mira AWM lenta para acompanhar alvos";
        tip = "Aumentamos a velocidade de arraste exclusiva da AWM.";
        break;
      }
      case "awm_fast": {
        rawDeltas.AWM = -Math.max(2, Math.round(6 * damping));
        reason = "Mira AWM rápida demais";
        tip = "Reduzimos a sensibilidade da AWM para maior firmeza no disparo.";
        break;
      }
      default:
        throw new Error(`Tipo de calibração desconhecido: ${feedbackType}`);
    }

    const nextValues = {};
    const appliedDeltas = {};
    const learningState = {};

    for (const key of SCOPE_KEYS) {
      const previous = memoryInput[key] && typeof memoryInput[key] === "object"
        ? memoryInput[key] : {};
      const direction = Math.sign(rawDeltas[key]);
      const sameDirectionCount = direction !== 0 && Number(previous.lastDirection) === direction
        ? Math.min(5, Math.max(0, Number(previous.sameDirectionCount) || 0)) : 0;
      const learningFactor = sameDirectionCount === 0 ? 1 : Math.max(0.45, 1 - sameDirectionCount * 0.15);
      const learnedDelta = rawDeltas[key] === 0 ? 0 : Math.sign(rawDeltas[key]) *
        Math.max(1, Math.round(Math.abs(rawDeltas[key]) * learningFactor));

      nextValues[key] = clamp(prev[key] + learnedDelta, MIN_SENSI, MAX_SENSI);
      appliedDeltas[key] = nextValues[key] - prev[key];
      learningState[key] = direction === 0
        ? { lastDirection: Number(previous.lastDirection) || 0, sameDirectionCount }
        : {
            lastDirection: direction,
            sameDirectionCount: sameDirectionCount + 1,
          };
    }

    return {
      values: nextValues,
      deltas: appliedDeltas,
      learningState,
      reason,
      tip: sameDirectionCountForTip(learningState) ? tip + " O motor reduziu gradualmente o passo nas miras que receberam correções repetidas na mesma direção." : tip,
    };
  }

  function sameDirectionCountForTip(state) {
    return SCOPE_KEYS.some((key) => state[key].sameDirectionCount > 1);
  }

  function compareConfigurations(entryA, entryB) {
    if (!entryA?.values || !entryB?.values) {
      throw new Error("Duas configurações válidas são necessárias para comparar.");
    }
    const rows = SCOPE_KEYS.map((key) => {
      const a = sanitizeNumber(entryA.values[key], 0, MIN_SENSI, MAX_SENSI);
      const b = sanitizeNumber(entryB.values[key], 0, MIN_SENSI, MAX_SENSI);
      return {
        scope: key,
        valueA: a,
        valueB: b,
        diff: b - a,
      };
    });

    return {
      labelA: entryA.name || `${entryA.config?.marca || ""} ${entryA.config?.modelo || "Perfil A"}`.trim(),
      labelB: entryB.name || `${entryB.config?.marca || ""} ${entryB.config?.modelo || "Perfil B"}`.trim(),
      configA: entryA.config || {},
      configB: entryB.config || {},
      rows,
    };
  }

  const api = {
    SCOPE_KEYS,
    MIN_SENSI,
    MAX_SENSI,
    PROFILES,
    PROCESSOR_TIERS,
    normalizeInput,
    generateSensitivity,
    recommendDisplaySetup,
    adjustSingleScope,
    setScopeValue(currentValues, scopeKey, value) { if (!SCOPE_KEYS.includes(scopeKey)) throw new Error("Mira inválida: " + scopeKey); return { ...currentValues, [scopeKey]: sanitizeNumber(value, currentValues[scopeKey], MIN_SENSI, MAX_SENSI) }; },
    applyAdaptiveCalibration,
    compareConfigurations,
  };

  root.SensiEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
