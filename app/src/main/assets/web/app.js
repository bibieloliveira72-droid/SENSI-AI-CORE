(() => {
  "use strict";

  const STORAGE_SAVED = "sensi_ai_saved_profiles_v2";
  const STORAGE_HISTORY = "sensi_ai_history_v2";
  const MAX_HISTORY = 25;

  const SCOPE_LABELS = [
    { key: "General", label: "Geral" },
    { key: "Red Dot", label: "Red Dot" },
    { key: "2x", label: "Mira 2x" },
    { key: "4x", label: "Mira 4x" },
    { key: "AWM", label: "AWM" },
    { key: "Olhadinha", label: "Olhadinha" },
  ];

  const els = {
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanels: {
      generator: document.getElementById("tab-generator"),
      saved: document.getElementById("tab-saved"),
      compare: document.getElementById("tab-compare"),
    },

    form: document.getElementById("sensiForm"),
    marcaSelect: document.getElementById("marcaSelect"),
    customBrandField: document.getElementById("customBrandField"),
    customMarcaInput: document.getElementById("customMarcaInput"),
    modeloInput: document.getElementById("modeloInput"),
    processadorSelect: document.getElementById("processadorSelect"),
    processadorDetalheInput: document.getElementById("processadorDetalheInput"),
    ramChips: document.getElementById("ramChips"),
    ramInput: document.getElementById("ramInput"),
    hzChips: document.getElementById("hzChips"),
    hzInput: document.getElementById("hzInput"),
    dpiInput: document.getElementById("dpiInput"),
    dpiPresets: document.getElementById("dpiPresets"),
    fireButtonRange: document.getElementById("fireButtonRange"),
    fireButtonBadge: document.getElementById("fireButtonBadge"),
    fireButtonPresets: document.getElementById("fireButtonPresets"),
    profileCards: document.getElementById("profileCards"),
    profileInput: document.getElementById("profileInput"),

    errorBox: document.getElementById("errorBox"),
    resultsSection: document.getElementById("resultsSection"),
    deviceSummary: document.getElementById("deviceSummary"),
    sensiGrid: document.getElementById("sensiGrid"),
    copyAllBtn: document.getElementById("copyAllBtn"),

    calibrationButtons: document.getElementById("calibrationButtons"),
    calibrationFeedbackBox: document.getElementById("calibrationFeedbackBox"),
    resetBaseBtn: document.getElementById("resetBaseBtn"),

    saveProfileNameInput: document.getElementById("saveProfileNameInput"),
    saveProfileBtn: document.getElementById("saveProfileBtn"),

    notesBox: document.getElementById("notesBox"),
    notesList: document.getElementById("notesList"),
    disclaimerText: document.getElementById("disclaimerText"),
    staticDisclaimer: document.getElementById("staticDisclaimer"),

    savedCountBadge: document.getElementById("savedCountBadge"),
    savedProfilesList: document.getElementById("savedProfilesList"),
    historyList: document.getElementById("historyList"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),

    compareSelectA: document.getElementById("compareSelectA"),
    compareSelectB: document.getElementById("compareSelectB"),
    compareResultBox: document.getElementById("compareResultBox"),

    toast: document.getElementById("toast"),
  };

  let activeState = null;
  let idCounter = 0;
  let toastTimer = null;

  function createLocalId(prefix) {
    idCounter += 1;
    return `${prefix}_${Date.now()}_${idCounter}`;
  }

  function readStorageArray(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      return [];
    }
  }

  function writeStorageArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 2400);
  }

  function showError(message) {
    els.errorBox.textContent = message;
    els.errorBox.classList.remove("hidden");
  }

  function clearError() {
    els.errorBox.textContent = "";
    els.errorBox.classList.add("hidden");
  }

  function formatDateTime(ts) {
    try {
      return new Date(ts).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_err) {
      return "";
    }
  }

  function formatValuesInline(values) {
    return `G:${values.General} | RD:${values["Red Dot"]} | 2x:${values["2x"]} | 4x:${values["4x"]} | AWM:${values.AWM} | Olh:${values.Olhadinha}`;
  }

  function buildCopyBlock(entry) {
    const cfg = entry.config;
    const v = entry.values;
    return [
      `SENSI.AI — ${cfg.marca} ${cfg.modelo} (${entry.profileLabel})`,
      `Hardware: ${cfg.ram}GB RAM | ${cfg.hz}Hz | ${cfg.dpi} DPI | Botão de tiro: ${cfg.fireButtonSize}%`,
      `Geral (General): ${v.General}`,
      `Red Dot: ${v["Red Dot"]}`,
      `Mira 2x: ${v["2x"]}`,
      `Mira 4x: ${v["4x"]}`,
      `AWM: ${v.AWM}`,
      `Olhadinha: ${v.Olhadinha}`,
      "",
      "Obs.: Sugestão inicial ajustável por testes no modo treinamento.",
    ].join("\n");
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
      showToast(ok ? successMsg : "Não foi possível copiar.");
    } catch (_err) {
      showToast("Falha ao acessar a área de transferência.");
    }
  }

  function switchTab(tabId) {
    els.tabBtns.forEach((btn) => {
      const isSelected = btn.dataset.tab === tabId;
      btn.classList.toggle("active", isSelected);
      btn.setAttribute("aria-selected", String(isSelected));
    });

    Object.entries(els.tabPanels).forEach(([key, panel]) => {
      panel.classList.toggle("hidden", key !== tabId);
    });

    if (tabId === "saved") {
      renderSavedAndHistory();
    } else if (tabId === "compare") {
      renderComparisonSelectors();
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

  function selectChipValue(containerEl, hiddenInputEl, value) {
    const strVal = String(value);
    hiddenInputEl.value = strVal;
    containerEl
      .querySelectorAll("button[data-value]")
      .forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.value === strVal);
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

  function syncFireButtonUi(val) {
    const num = Math.max(25, Math.min(90, Number.parseInt(val, 10) || 52));
    els.fireButtonRange.value = String(num);
    els.fireButtonBadge.textContent = `${num}%`;
    els.fireButtonPresets
      .querySelectorAll("button[data-fire]")
      .forEach((btn) => {
        btn.classList.toggle("active", Number.parseInt(btn.dataset.fire, 10) === num);
      });
  }

  function syncProfileCardSelection(profileId) {
    els.profileInput.value = profileId;
    els.profileCards
      .querySelectorAll("button[data-profile]")
      .forEach((card) => {
        card.classList.toggle("active", card.dataset.profile === profileId);
      });
  }

  function collectFormInput() {
    const selectedBrand = els.marcaSelect.value;
    const marca =
      selectedBrand === "Outra"
        ? els.customMarcaInput.value.trim()
        : selectedBrand;

    return {
      marca,
      modelo: els.modeloInput.value.trim(),
      processador: els.processadorSelect.value,
      processadorDetalhe: els.processadorDetalheInput.value.trim(),
      ram: Number.parseInt(els.ramInput.value, 10),
      hz: Number.parseInt(els.hzInput.value, 10),
      dpi: Number.parseInt(els.dpiInput.value, 10),
      fireButtonSize: Number.parseInt(els.fireButtonRange.value, 10),
      profile: els.profileInput.value,
    };
  }

  function applyInputToForm(config) {
    const standardBrands = Array.from(els.marcaSelect.options).map((o) => o.value);
    if (standardBrands.includes(config.marca)) {
      els.marcaSelect.value = config.marca;
      els.customBrandField.classList.add("hidden");
    } else {
      els.marcaSelect.value = "Outra";
      els.customBrandField.classList.remove("hidden");
      els.customMarcaInput.value = config.marca || "";
    }

    els.modeloInput.value = config.modelo || "";
    els.processadorSelect.value = config.processador || "intermediario_plus";
    els.processadorDetalheInput.value = config.processadorDetalhe || "";
    selectChipValue(els.ramChips, els.ramInput, config.ram || 8);
    selectChipValue(els.hzChips, els.hzInput, config.hz || 120);
    els.dpiInput.value = String(config.dpi || 600);
    syncDpiPresetHighlight();
    syncFireButtonUi(config.fireButtonSize || 52);
    syncProfileCardSelection(config.profile || "capa");
  }

  function renderActiveResults() {
    if (!activeState) return;
    const { config, profileLabel, values, notes, disclaimer } = activeState;

    els.deviceSummary.textContent = `${config.marca} ${config.modelo} • ${profileLabel} • ${config.ram}GB • ${config.hz}Hz • ${config.dpi} DPI • Botão ${config.fireButtonSize}%`;
    els.sensiGrid.innerHTML = "";

    SCOPE_LABELS.forEach(({ key, label }) => {
      const value = values[key];
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
      copyBtn.addEventListener("click", () => {
        copyToClipboard(`${label}: ${value}`, `${label} (${value}) copiado!`);
      });

      top.appendChild(nameEl);
      top.appendChild(copyBtn);

      const valueRow = document.createElement("div");
      valueRow.className = "sensi-value-row";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "step-btn";
      minusBtn.textContent = "-1";
      minusBtn.setAttribute("aria-label", `Diminuir ${label} em 1 ponto`);
      minusBtn.addEventListener("click", () => handleSingleAdjust(key, -1));

      const valEl = document.createElement("div");
      valEl.className = "sensi-value";
      valEl.textContent = String(value);

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "step-btn";
      plusBtn.textContent = "+1";
      plusBtn.setAttribute("aria-label", `Aumentar ${label} em 1 ponto`);
      plusBtn.addEventListener("click", () => handleSingleAdjust(key, 1));

      valueRow.appendChild(minusBtn);
      valueRow.appendChild(valEl);
      valueRow.appendChild(plusBtn);

      const bar = document.createElement("div");
      bar.className = "sensi-bar";
      const fill = document.createElement("div");
      fill.className = "sensi-bar-fill";
      fill.style.width = `${pct}%`;
      bar.appendChild(fill);

      card.appendChild(top);
      card.appendChild(valueRow);
      card.appendChild(bar);
      els.sensiGrid.appendChild(card);
    });

    if (Array.isArray(notes) && notes.length > 0) {
      els.notesList.innerHTML = "";
      notes.forEach((tip) => {
        const li = document.createElement("li");
        li.textContent = tip;
        els.notesList.appendChild(li);
      });
      els.notesBox.classList.remove("hidden");
    } else {
      els.notesBox.classList.add("hidden");
    }

    if (disclaimer) {
      els.disclaimerText.textContent = disclaimer;
    }

    els.saveProfileNameInput.placeholder = `${config.marca} ${config.modelo} • ${profileLabel}`;
    els.resultsSection.classList.remove("hidden");
    els.staticDisclaimer.classList.add("hidden");
  }

  function recordHistoryEntry(entry) {
    const history = readStorageArray(STORAGE_HISTORY);
    history.unshift({
      id: createLocalId("hist"),
      createdAt: Date.now(),
      name: `${entry.config.marca} ${entry.config.modelo} (${entry.profileLabel})`,
      config: entry.config,
      profileLabel: entry.profileLabel,
      values: { ...entry.values },
    });
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }
    writeStorageArray(STORAGE_HISTORY, history);
  }

  function handleGenerateSubmit(event) {
    event.preventDefault();
    clearError();

    const raw = collectFormInput();
    if (!raw.marca || raw.marca.length < 2) {
      showError("Informe a marca do smartphone.");
      return;
    }
    if (!raw.modelo) {
      showError("Informe o modelo do smartphone.");
      return;
    }
    if (!Number.isInteger(raw.dpi) || raw.dpi < 200 || raw.dpi > 1600) {
      showError("A DPI deve estar entre 200 e 1600.");
      return;
    }

    const generated = window.SensiEngine.generateSensitivity(raw);
    activeState = {
      config: generated.config,
      profileLabel: generated.profileLabel,
      values: { ...generated.values },
      baseValues: { ...generated.values },
      notes: generated.notes,
      disclaimer: generated.disclaimer,
      calibrationSteps: 0,
    };

    els.calibrationFeedbackBox.classList.add("hidden");
    els.calibrationFeedbackBox.textContent = "";

    recordHistoryEntry(activeState);
    renderActiveResults();
    els.resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function handleSingleAdjust(scopeKey, delta) {
    if (!activeState) return;
    activeState.values = window.SensiEngine.adjustSingleScope(
      activeState.values,
      scopeKey,
      delta
    );
    renderActiveResults();
  }

  function handleCalibrationClick(feedbackType) {
    if (!activeState) return;
    const prevValues = { ...activeState.values };
    const result = window.SensiEngine.applyAdaptiveCalibration(
      activeState.values,
      feedbackType,
      {
        dpi: activeState.config.dpi,
        fireButtonSize: activeState.config.fireButtonSize,
        calibrationSteps: activeState.calibrationSteps,
      }
    );

    activeState.values = result.values;
    activeState.calibrationSteps += 1;

    const changedParts = Object.entries(result.deltas)
      .filter(([, d]) => d !== 0)
      .map(([scope, d]) => {
        const sign = d > 0 ? `+${d}` : String(d);
        return `${scope}: ${prevValues[scope]} → ${result.values[scope]} (${sign})`;
      });

    els.calibrationFeedbackBox.innerHTML = "";
    const titleEl = document.createElement("strong");
    titleEl.textContent = `${result.reason}: `;
    const tipEl = document.createElement("span");
    tipEl.textContent = result.tip;
    els.calibrationFeedbackBox.appendChild(titleEl);
    els.calibrationFeedbackBox.appendChild(tipEl);

    if (changedParts.length > 0) {
      const diffEl = document.createElement("div");
      diffEl.style.marginTop = "6px";
      diffEl.style.fontFamily = "var(--font-mono)";
      diffEl.style.fontSize = "0.76rem";
      diffEl.textContent = changedParts.join("  •  ");
      els.calibrationFeedbackBox.appendChild(diffEl);
    }

    els.calibrationFeedbackBox.classList.remove("hidden");
    recordHistoryEntry(activeState);
    renderActiveResults();
  }

  function handleResetBase() {
    if (!activeState) return;
    activeState.values = { ...activeState.baseValues };
    activeState.calibrationSteps = 0;
    els.calibrationFeedbackBox.classList.add("hidden");
    renderActiveResults();
    showToast("Valores restaurados para a base calculada.");
  }

  function handleSaveProfile() {
    if (!activeState) return;
    const customName = els.saveProfileNameInput.value.trim();
    const defaultName = `${activeState.config.marca} ${activeState.config.modelo} • ${activeState.profileLabel}`;
    const name = (customName || defaultName).slice(0, 48);

    const saved = readStorageArray(STORAGE_SAVED);
    saved.unshift({
      id: createLocalId("prof"),
      createdAt: Date.now(),
      name,
      config: activeState.config,
      profileLabel: activeState.profileLabel,
      values: { ...activeState.values },
    });
    writeStorageArray(STORAGE_SAVED, saved);
    els.saveProfileNameInput.value = "";
    showToast(`Perfil "${name}" salvo no aparelho!`);
  }

  function loadEntryIntoEditor(entry) {
    applyInputToForm(entry.config);
    const regenerated = window.SensiEngine.generateSensitivity(entry.config);
    activeState = {
      config: entry.config,
      profileLabel: entry.profileLabel || regenerated.profileLabel,
      values: { ...entry.values },
      baseValues: { ...regenerated.values },
      notes: regenerated.notes,
      disclaimer: regenerated.disclaimer,
      calibrationSteps: 0,
    };
    els.calibrationFeedbackBox.classList.add("hidden");
    renderActiveResults();
    switchTab("generator");
    showToast("Perfil carregado para edição e calibração.");
  }

  function renderSavedAndHistory() {
    const saved = readStorageArray(STORAGE_SAVED);
    const history = readStorageArray(STORAGE_HISTORY);

    els.savedCountBadge.textContent = `${saved.length} SALVO${saved.length === 1 ? "" : "S"}`;
    els.savedProfilesList.innerHTML = "";

    if (saved.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        "Nenhum perfil salvo ainda. Gere uma sensibilidade e toque em SALVAR PERFIL.";
      els.savedProfilesList.appendChild(empty);
    } else {
      saved.forEach((item) => {
        els.savedProfilesList.appendChild(buildEntryCard(item, "saved"));
      });
    }

    els.historyList.innerHTML = "";
    if (history.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent =
        "O histórico local ainda está vazio. Suas gerações e calibrações aparecerão aqui automaticamente.";
      els.historyList.appendChild(empty);
    } else {
      history.forEach((item) => {
        els.historyList.appendChild(buildEntryCard(item, "history"));
      });
    }
  }

  function buildEntryCard(item, sourceType) {
    const card = document.createElement("div");
    card.className = "saved-item";

    const top = document.createElement("div");
    top.className = "saved-item-top";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "saved-item-title";
    title.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "saved-item-meta";
    meta.textContent = `${item.config.dpi} DPI • ${item.config.hz}Hz • ${item.config.ram}GB • Botão ${item.config.fireButtonSize}% • ${formatDateTime(item.createdAt)}`;

    titleWrap.appendChild(title);
    titleWrap.appendChild(meta);
    top.appendChild(titleWrap);

    const pill = document.createElement("div");
    pill.className = "saved-values-pill";
    pill.textContent = formatValuesInline(item.values);

    const actions = document.createElement("div");
    actions.className = "saved-actions";

    const loadBtn = document.createElement("button");
    loadBtn.type = "button";
    loadBtn.className = "btn-ghost-sm";
    loadBtn.textContent = "Carregar";
    loadBtn.addEventListener("click", () => loadEntryIntoEditor(item));

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn-ghost-sm";
    copyBtn.textContent = "Copiar";
    copyBtn.addEventListener("click", () => {
      copyToClipboard(buildCopyBlock(item), "Sensibilidade copiada!");
    });

    const compareBtn = document.createElement("button");
    compareBtn.type = "button";
    compareBtn.className = "btn-ghost-sm";
    compareBtn.textContent = "Comparar";
    compareBtn.addEventListener("click", () => {
      switchTab("compare");
      renderComparisonSelectors(item.id);
    });

    actions.appendChild(loadBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(compareBtn);

    if (sourceType === "saved") {
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-danger-sm";
      deleteBtn.textContent = "Excluir";
      deleteBtn.addEventListener("click", () => {
        const next = readStorageArray(STORAGE_SAVED).filter((x) => x.id !== item.id);
        writeStorageArray(STORAGE_SAVED, next);
        renderSavedAndHistory();
        showToast("Perfil removido.");
      });
      actions.appendChild(deleteBtn);
    }

    card.appendChild(top);
    card.appendChild(pill);
    card.appendChild(actions);
    return card;
  }

  function getComparablePool() {
    const pool = [];
    if (activeState) {
      pool.push({
        id: "current_active",
        name: `Atual: ${activeState.config.marca} ${activeState.config.modelo} (${activeState.profileLabel})`,
        config: activeState.config,
        profileLabel: activeState.profileLabel,
        values: activeState.values,
      });
    }

    readStorageArray(STORAGE_SAVED).forEach((item) => {
      pool.push({ ...item, name: `Perfil: ${item.name}` });
    });

    readStorageArray(STORAGE_HISTORY).forEach((item) => {
      pool.push({
        ...item,
        name: `Histórico (${formatDateTime(item.createdAt)}): ${item.name}`,
      });
    });

    return pool;
  }

  function renderComparisonSelectors(preferredIdB) {
    const pool = getComparablePool();
    els.compareSelectA.innerHTML = "";
    els.compareSelectB.innerHTML = "";

    if (pool.length < 2) {
      els.compareResultBox.innerHTML =
        '<div class="empty-state">Gere ou salve pelo menos duas sensibilidades para comparar lado a lado.</div>';
      return;
    }

    pool.forEach((entry) => {
      const optA = document.createElement("option");
      optA.value = entry.id;
      optA.textContent = entry.name;
      els.compareSelectA.appendChild(optA);

      const optB = document.createElement("option");
      optB.value = entry.id;
      optB.textContent = entry.name;
      els.compareSelectB.appendChild(optB);
    });

    els.compareSelectA.value = pool[0].id;
    els.compareSelectB.value =
      preferredIdB && pool.some((p) => p.id === preferredIdB)
        ? preferredIdB
        : pool[1].id;

    renderComparisonTable(pool);
  }

  function renderComparisonTable(poolArg) {
    const pool = poolArg || getComparablePool();
    const entryA = pool.find((p) => p.id === els.compareSelectA.value);
    const entryB = pool.find((p) => p.id === els.compareSelectB.value);

    if (!entryA || !entryB) {
      els.compareResultBox.innerHTML =
        '<div class="empty-state">Selecione duas configurações para comparar.</div>';
      return;
    }

    const comparison = window.SensiEngine.compareConfigurations(entryA, entryB);
    const table = document.createElement("table");
    table.className = "compare-table";

    const thead = document.createElement("thead");
    thead.innerHTML =
      "<tr><th>Mira</th><th>Config A</th><th>Config B</th><th>Diferença</th></tr>";
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    comparison.rows.forEach((row) => {
      const tr = document.createElement("tr");
      const labelObj = SCOPE_LABELS.find((s) => s.key === row.scope);
      const tdName = document.createElement("td");
      tdName.textContent = labelObj ? labelObj.label : row.scope;

      const tdA = document.createElement("td");
      tdA.className = "compare-num";
      tdA.textContent = String(row.valueA);

      const tdB = document.createElement("td");
      tdB.className = "compare-num";
      tdB.textContent = String(row.valueB);

      const tdDiff = document.createElement("td");
      if (row.diff > 0) {
        tdDiff.className = "delta-pos";
        tdDiff.textContent = `+${row.diff}`;
      } else if (row.diff < 0) {
        tdDiff.className = "delta-neg";
        tdDiff.textContent = String(row.diff);
      } else {
        tdDiff.className = "delta-zero";
        tdDiff.textContent = "=";
      }

      tr.appendChild(tdName);
      tr.appendChild(tdA);
      tr.appendChild(tdB);
      tr.appendChild(tdDiff);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const metaBox = document.createElement("div");
    metaBox.className = "compare-meta-box";

    const rowA = document.createElement("div");
    const strongA = document.createElement("strong");
    strongA.textContent = "A: ";
    rowA.appendChild(strongA);
    rowA.appendChild(
      document.createTextNode(
        `${entryA.config.marca} ${entryA.config.modelo} • ${entryA.config.dpi} DPI • ${entryA.config.hz}Hz • Botão ${entryA.config.fireButtonSize}%`
      )
    );

    const rowB = document.createElement("div");
    const strongB = document.createElement("strong");
    strongB.textContent = "B: ";
    rowB.appendChild(strongB);
    rowB.appendChild(
      document.createTextNode(
        `${entryB.config.marca} ${entryB.config.modelo} • ${entryB.config.dpi} DPI • ${entryB.config.hz}Hz • Botão ${entryB.config.fireButtonSize}%`
      )
    );

    metaBox.appendChild(rowA);
    metaBox.appendChild(rowB);

    els.compareResultBox.innerHTML = "";
    els.compareResultBox.appendChild(table);
    els.compareResultBox.appendChild(metaBox);
  }

  function init() {
    els.tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
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

    els.fireButtonRange.addEventListener("input", (event) => {
      syncFireButtonUi(event.target.value);
    });
    els.fireButtonPresets.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-fire]");
      if (!btn) return;
      syncFireButtonUi(btn.dataset.fire);
    });

    els.profileCards.addEventListener("click", (event) => {
      const card = event.target.closest("button[data-profile]");
      if (!card) return;
      syncProfileCardSelection(card.dataset.profile);
    });

    els.form.addEventListener("submit", handleGenerateSubmit);

    els.calibrationButtons.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-feedback]");
      if (!btn) return;
      handleCalibrationClick(btn.dataset.feedback);
    });

    els.resetBaseBtn.addEventListener("click", handleResetBase);
    els.saveProfileBtn.addEventListener("click", handleSaveProfile);

    els.copyAllBtn.addEventListener("click", () => {
      if (!activeState) return;
      copyToClipboard(
        buildCopyBlock(activeState),
        "Todas as sensibilidades copiadas!"
      );
    });

    els.clearHistoryBtn.addEventListener("click", () => {
      writeStorageArray(STORAGE_HISTORY, []);
      renderSavedAndHistory();
      showToast("Histórico limpo.");
    });

    els.compareSelectA.addEventListener("change", () => renderComparisonTable());
    els.compareSelectB.addEventListener("change", () => renderComparisonTable());
  }

  document.addEventListener("DOMContentLoaded", init);
})();
