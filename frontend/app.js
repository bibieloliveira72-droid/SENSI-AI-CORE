(() => {
  "use strict";

  const STORAGE_BACKEND_URL = "sensi_ai_backend_url";
  const STORAGE_PROVIDER = "sensi_ai_provider";
  const SENSITIVITY_LABELS = [
    { key: "General", label: "Geral" },
    { key: "Red Dot", label: "Red Dot" },
    { key: "2x", label: "Mira 2x" },
    { key: "4x", label: "Mira 4x" },
    { key: "AWM", label: "AWM" },
    { key: "Olhadinha", label: "Olhadinha" },
  ];

  const els = {
    toggleServerBtn: document.getElementById("toggleServerBtn"),
    serverPanel: document.getElementById("serverPanel"),
    providerRow: document.getElementById("providerRow"),
    providerSelect: document.getElementById("providerSelect"),
    nodeConfigBox: document.getElementById("nodeConfigBox"),
    serverDot: document.getElementById("serverDot"),
    serverStatusText: document.getElementById("serverStatusText"),
    backendUrlInput: document.getElementById("backendUrlInput"),
    saveServerBtn: document.getElementById("saveServerBtn"),
    testHealthBtn: document.getElementById("testHealthBtn"),
    healthResult: document.getElementById("healthResult"),

    form: document.getElementById("sensiForm"),
    marcaSelect: document.getElementById("marcaSelect"),
    customBrandField: document.getElementById("customBrandField"),
    customMarcaInput: document.getElementById("customMarcaInput"),
    modeloInput: document.getElementById("modeloInput"),
    ramChips: document.getElementById("ramChips"),
    ramInput: document.getElementById("ramInput"),
    hzChips: document.getElementById("hzChips"),
    hzInput: document.getElementById("hzInput"),
    dpiInput: document.getElementById("dpiInput"),
    dpiPresets: document.getElementById("dpiPresets"),
    estiloSelect: document.getElementById("estiloSelect"),
    miraSelect: document.getElementById("miraSelect"),

    errorBox: document.getElementById("errorBox"),
    generateBtn: document.getElementById("generateBtn"),
    btnSpinner: document.getElementById("btnSpinner"),
    btnLabel: document.getElementById("btnLabel"),

    resultsSection: document.getElementById("resultsSection"),
    deviceSummary: document.getElementById("deviceSummary"),
    sensiGrid: document.getElementById("sensiGrid"),
    copyAllBtn: document.getElementById("copyAllBtn"),
    notesBox: document.getElementById("notesBox"),
    notesText: document.getElementById("notesText"),
    disclaimerText: document.getElementById("disclaimerText"),
    staticDisclaimer: document.getElementById("staticDisclaimer"),
    toast: document.getElementById("toast"),
  };

  let lastResult = null;
  let lastProfile = null;
  let toastTimer = null;
  const pendingFirebaseCallbacks = new Map();

  window.__onFirebaseSensiResult = (callbackId, ok, payloadOrError) => {
    const entry = pendingFirebaseCallbacks.get(callbackId);
    if (!entry) return;
    pendingFirebaseCallbacks.delete(callbackId);
    clearTimeout(entry.timer);

    if (ok) {
      try {
        const parsed =
          typeof payloadOrError === "string"
            ? JSON.parse(payloadOrError)
            : payloadOrError;
        entry.resolve(parsed);
      } catch (_err) {
        entry.reject(new Error("Resposta JSON inválida retornada pelo Firebase AI."));
      }
    } else {
      entry.reject(new Error(String(payloadOrError || "Falha no Firebase AI Logic.")));
    }
  };

  function hasNativeFirebaseAi() {
    return Boolean(
      window.AndroidBridge &&
        typeof window.AndroidBridge.hasFirebaseAi === "function" &&
        window.AndroidBridge.hasFirebaseAi() &&
        typeof window.AndroidBridge.generateSensiWithFirebase === "function"
    );
  }

  function getActiveProvider() {
    if (!hasNativeFirebaseAi()) {
      return "node";
    }
    const saved = localStorage.getItem(STORAGE_PROVIDER);
    return saved === "node" ? "node" : "firebase";
  }

  function isPackagedWebView() {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return (
      protocol === "file:" ||
      protocol === "capacitor:" ||
      host === "appassets.androidplatform.net"
    );
  }

  function normalizeBaseUrl(rawUrl) {
    const trimmed = String(rawUrl || "").trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `http://${trimmed}`;
    }
    return trimmed;
  }

  function getDefaultBackendUrl() {
    if (isPackagedWebView()) {
      return "http://10.0.2.2:3000";
    }
    return window.location.origin;
  }

  function getBackendUrl() {
    const saved = localStorage.getItem(STORAGE_BACKEND_URL);
    return normalizeBaseUrl(saved) || getDefaultBackendUrl();
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 2600);
  }

  function showError(message) {
    els.errorBox.textContent = message;
    els.errorBox.classList.remove("hidden");
  }

  function clearError() {
    els.errorBox.textContent = "";
    els.errorBox.classList.add("hidden");
  }

  function setLoading(isLoading) {
    els.generateBtn.disabled = isLoading;
    els.btnSpinner.classList.toggle("hidden", !isLoading);
    els.btnLabel.textContent = isLoading
      ? "CALIBRANDO COM IA..."
      : "GERAR SENSIBILIDADE";
  }

  function setServerIndicator(state, text) {
    els.serverDot.classList.remove("online", "offline");
    if (state === "online") els.serverDot.classList.add("online");
    if (state === "offline") els.serverDot.classList.add("offline");
    els.serverStatusText.textContent = text;
  }

  function syncProviderUi() {
    const nativeAvailable = hasNativeFirebaseAi();
    const provider = getActiveProvider();

    els.providerRow.classList.toggle("hidden", !nativeAvailable);
    if (nativeAvailable) {
      els.providerSelect.value = provider;
    }

    const usingFirebase = nativeAvailable && provider === "firebase";
    els.nodeConfigBox.classList.toggle("hidden", usingFirebase);

    if (usingFirebase) {
      setServerIndicator("online", "Firebase AI");
    } else {
      checkBackendHealth(false);
    }
  }

  async function checkBackendHealth(showFeedback) {
    const baseUrl = getBackendUrl();
    if (showFeedback) {
      els.healthResult.textContent = "Verificando...";
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${baseUrl}/api/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data.geminiConfigured) {
        setServerIndicator("online", "API Online");
        if (showFeedback) {
          els.healthResult.textContent = "Conectado e Gemini pronto.";
        }
      } else {
        setServerIndicator("offline", "Sem Chave");
        if (showFeedback) {
          els.healthResult.textContent =
            "Servidor online, mas GEMINI_API_KEY não configurada no backend.";
        }
      }
    } catch (_err) {
      setServerIndicator("offline", "Offline");
      if (showFeedback) {
        els.healthResult.textContent = `Sem resposta de ${baseUrl}`;
      }
    }
  }

  function setupChipSelector(containerEl, hiddenInputEl) {
    containerEl.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-value]");
      if (!btn) return;
      containerEl
        .querySelectorAll("button[data-value]")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      hiddenInputEl.value = btn.dataset.value;
    });
  }

  function syncDpiPresetHighlight() {
    const current = els.dpiInput.value.trim();
    els.dpiPresets
      .querySelectorAll("button[data-dpi]")
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.dpi === current);
      });
  }

  async function copyToClipboard(text, successMsg) {
    try {
      if (
        window.AndroidBridge &&
        typeof window.AndroidBridge.copyText === "function"
      ) {
        window.AndroidBridge.copyText(text);
        showToast(successMsg);
        return;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showToast(successMsg);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        showToast(successMsg);
      } else {
        showToast("Não foi possível copiar automaticamente.");
      }
    } catch (_err) {
      showToast("Falha ao acessar a área de transferência.");
    }
  }

  function renderSensitivityResults(data, profile) {
    lastResult = data;
    lastProfile = profile;

    els.deviceSummary.textContent = `${profile.marca} ${profile.modelo} • ${profile.ram}GB • ${profile.taxaAtualizacao}Hz • ${profile.dpi} DPI`;
    els.sensiGrid.innerHTML = "";

    SENSITIVITY_LABELS.forEach(({ key, label }) => {
      const value = Number(data[key] ?? 0);
      const pct = Math.max(0, Math.min(100, Math.round((value / 200) * 100)));

      const card = document.createElement("div");
      card.className = "sensi-item";

      const top = document.createElement("div");
      top.className = "sensi-top";

      const nameEl = document.createElement("span");
      nameEl.className = "sensi-name";
      nameEl.textContent = label;

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "copy-one-btn";
      copyBtn.textContent = "COPIAR";
      copyBtn.setAttribute("aria-label", `Copiar sensibilidade ${label}`);
      copyBtn.addEventListener("click", () => {
        copyToClipboard(`${label}: ${value}`, `${label} (${value}) copiado!`);
      });

      top.appendChild(nameEl);
      top.appendChild(copyBtn);

      const valEl = document.createElement("div");
      valEl.className = "sensi-value";
      valEl.textContent = String(value);

      const bar = document.createElement("div");
      bar.className = "sensi-bar";
      const fill = document.createElement("div");
      fill.className = "sensi-bar-fill";
      fill.style.width = `${pct}%`;
      bar.appendChild(fill);

      card.appendChild(top);
      card.appendChild(valEl);
      card.appendChild(bar);
      els.sensiGrid.appendChild(card);
    });

    if (data.observacoes) {
      els.notesText.textContent = data.observacoes;
      els.notesBox.classList.remove("hidden");
    } else {
      els.notesBox.classList.add("hidden");
    }

    if (data.aviso) {
      els.disclaimerText.textContent = data.aviso;
    }

    els.resultsSection.classList.remove("hidden");
    els.staticDisclaimer.classList.add("hidden");
    els.resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function collectFormPayload() {
    const selectedBrand = els.marcaSelect.value;
    const marca =
      selectedBrand === "Outra"
        ? els.customMarcaInput.value.trim()
        : selectedBrand;

    return {
      marca,
      modelo: els.modeloInput.value.trim(),
      ram: Number.parseInt(els.ramInput.value, 10),
      taxaAtualizacao: Number.parseInt(els.hzInput.value, 10),
      dpi: Number.parseInt(els.dpiInput.value, 10),
      estiloJogo: els.estiloSelect.value,
      preferenciaMira: els.miraSelect.value,
    };
  }

  function validateClientPayload(payload) {
    if (!payload.marca || payload.marca.length < 2) {
      return "Informe a marca do smartphone.";
    }
    if (!payload.modelo) {
      return "Informe o modelo do smartphone.";
    }
    if (!Number.isInteger(payload.dpi) || payload.dpi < 100 || payload.dpi > 2000) {
      return "A DPI deve estar entre 100 e 2000.";
    }
    return null;
  }

  function callFirebaseAiBridge(payload) {
    return new Promise((resolve, reject) => {
      const callbackId = `cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timer = setTimeout(() => {
        pendingFirebaseCallbacks.delete(callbackId);
        reject(new Error("Tempo limite excedido ao aguardar o Firebase AI Logic."));
      }, 65000);

      pendingFirebaseCallbacks.set(callbackId, { resolve, reject, timer });
      window.AndroidBridge.generateSensiWithFirebase(
        JSON.stringify(payload),
        callbackId
      );
    });
  }

  async function callNodeBackend(payload) {
    const baseUrl = getBackendUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${baseUrl}/api/sensi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg =
          data?.error ||
          `Erro no servidor (${response.status}). Verifique a conexão com o backend.`;
        throw new Error(msg);
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    clearError();

    const payload = collectFormPayload();
    const clientError = validateClientPayload(payload);
    if (clientError) {
      showError(clientError);
      return;
    }

    const useFirebase = hasNativeFirebaseAi() && getActiveProvider() === "firebase";
    setLoading(true);

    try {
      const data = useFirebase
        ? await callFirebaseAiBridge(payload)
        : await callNodeBackend(payload);

      const requiredKeys = [
        "General",
        "Red Dot",
        "2x",
        "4x",
        "AWM",
        "Olhadinha",
      ];
      const hasAllKeys = requiredKeys.every((k) =>
        Number.isFinite(Number(data?.[k]))
      );
      if (!hasAllKeys) {
        throw new Error("Resposta incompleta recebida da IA.");
      }

      setServerIndicator("online", useFirebase ? "Firebase AI" : "API Online");
      renderSensitivityResults(data, payload);
    } catch (err) {
      if (err?.name === "AbortError") {
        showError("Tempo limite esgotado ao aguardar o servidor Gemini.");
      } else if (!useFirebase && err instanceof TypeError) {
        const baseUrl = getBackendUrl();
        setServerIndicator("offline", "Offline");
        showError(
          `Não foi possível conectar ao backend em ${baseUrl}. Abra "Servidor" no topo para configurar o endereço do Node.js.`
        );
      } else {
        showError(err?.message || "Falha ao gerar sensibilidade.");
      }
    } finally {
      setLoading(false);
    }
  }

  function init() {
    els.backendUrlInput.value = getBackendUrl();

    els.toggleServerBtn.addEventListener("click", () => {
      const hidden = els.serverPanel.classList.toggle("hidden");
      els.toggleServerBtn.setAttribute("aria-expanded", String(!hidden));
    });

    els.providerSelect.addEventListener("change", () => {
      localStorage.setItem(STORAGE_PROVIDER, els.providerSelect.value);
      syncProviderUi();
    });

    els.saveServerBtn.addEventListener("click", () => {
      const normalized = normalizeBaseUrl(els.backendUrlInput.value);
      if (!normalized) {
        els.healthResult.textContent = "Informe uma URL válida.";
        return;
      }
      localStorage.setItem(STORAGE_BACKEND_URL, normalized);
      els.backendUrlInput.value = normalized;
      showToast("Endereço do servidor salvo.");
      checkBackendHealth(true);
    });

    els.testHealthBtn.addEventListener("click", () => {
      checkBackendHealth(true);
    });

    els.marcaSelect.addEventListener("change", () => {
      const isOther = els.marcaSelect.value === "Outra";
      els.customBrandField.classList.toggle("hidden", !isOther);
      if (isOther) els.customMarcaInput.focus();
    });

    setupChipSelector(els.ramChips, els.ramInput);
    setupChipSelector(els.hzChips, els.hzInput);

    els.dpiPresets.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-dpi]");
      if (!btn) return;
      els.dpiInput.value = btn.dataset.dpi;
      syncDpiPresetHighlight();
    });

    els.dpiInput.addEventListener("input", syncDpiPresetHighlight);

    els.copyAllBtn.addEventListener("click", () => {
      if (!lastResult || !lastProfile) return;
      const lines = [
        `SENSI.AI — ${lastProfile.marca} ${lastProfile.modelo} (${lastProfile.dpi} DPI | ${lastProfile.taxaAtualizacao}Hz)`,
        `Geral (General): ${lastResult.General}`,
        `Red Dot: ${lastResult["Red Dot"]}`,
        `Mira 2x: ${lastResult["2x"]}`,
        `Mira 4x: ${lastResult["4x"]}`,
        `AWM: ${lastResult.AWM}`,
        `Olhadinha: ${lastResult.Olhadinha}`,
        "",
        "Obs.: Sugestão inicial para ajuste fino.",
      ];
      copyToClipboard(lines.join("\n"), "Todas as sensibilidades copiadas!");
    });

    els.form.addEventListener("submit", handleSubmit);

    syncProviderUi();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
