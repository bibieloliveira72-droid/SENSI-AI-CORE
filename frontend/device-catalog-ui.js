(() => {
  "use strict";

  function create(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function field(label, value) {
    const row = create("div", "device-spec-row");
    row.appendChild(create("span", "device-spec-label", label));
    row.appendChild(create("strong", "device-spec-value", value == null || value === "" ? "Não confirmado" : String(value)));
    return row;
  }

  function formatVariants(values, suffix) {
    return Array.isArray(values) && values.length ? values.join(" / ") + suffix : null;
  }

  function renderDetails(device, target) {
    target.innerHTML = "";
    const card = create("article", "device-detail-card");
    const header = create("div", "device-detail-header");
    const title = create("div");
    title.appendChild(create("h3", "", device.brand + " " + device.model));
    title.appendChild(create("p", "device-detail-subtitle", device.id.toUpperCase()));
    header.appendChild(title);
    header.appendChild(create("span", "device-status " + device.sourceStatus, device.sourceStatus === "completo" ? "FICHA COMPLETA" : "FICHA PARCIAL"));
    card.appendChild(header);

    const grid = create("div", "device-spec-grid");
    const specs = [
      ["Chipset", device.chipset],
      ["Rede", device.network],
      ["RAM", formatVariants(device.ramVariantsGB, " GB")],
      ["Armazenamento", formatVariants(device.storageVariantsGB, " GB")],
      ["Tela", [device.display.sizeInches ? device.display.sizeInches + '"' : null, device.display.technology, device.display.resolution].filter(Boolean).join(" • ") || null],
      ["Taxa da tela", device.display.refreshRateHz ? device.display.refreshRateHz + " Hz" : null],
      ["Bateria", device.battery.capacityMah ? device.battery.capacityMah + " mAh" : null],
      ["Carregamento", device.battery.chargingW ? device.battery.chargingW + " W" : null],
      ["Câmeras traseiras", device.cameras.rear],
      ["Câmera frontal", device.cameras.front],
      ["Sistema de lançamento", device.operatingSystemAtLaunch]
    ];
    specs.forEach(([label, value]) => grid.appendChild(field(label, value)));
    card.appendChild(grid);

    card.appendChild(create("p", "device-source-note", device.sourceNote || "Dados técnicos sujeitos à confirmação por variante."));
    const actions = create("div", "device-detail-actions");
    const useBtn = create("button", "btn-primary", "USAR NO GERADOR");
    useBtn.type = "button";
    useBtn.addEventListener("click", () => {
      const brandSelect = document.getElementById("marcaSelect");
      const customBrand = document.getElementById("customMarcaInput");
      const modelInput = document.getElementById("modeloInput");
      const processorSelect = document.getElementById("processadorSelect");
      const processorDetail = document.getElementById("processadorDetalheInput");
      const standard = Array.from(brandSelect.options).some((option) => option.value === device.brand);
      if (standard) {
        brandSelect.value = device.brand;
        document.getElementById("customBrandField").classList.add("hidden");
      } else {
        brandSelect.value = "Outra";
        document.getElementById("customBrandField").classList.remove("hidden");
        customBrand.value = device.brand;
      }
      modelInput.value = device.model;
      if (device.processorTier) processorSelect.value = device.processorTier;
      processorDetail.value = device.chipset || "";
      if (device.sensitivityDefaults.ram) {
        const ramButton = document.querySelector('#ramChips button[data-value="' + device.sensitivityDefaults.ram + '"]');
        if (ramButton) ramButton.click();
      }
      if (device.sensitivityDefaults.hz) {
        const hzButton = document.querySelector('#hzChips button[data-value="' + device.sensitivityDefaults.hz + '"]');
        if (hzButton) hzButton.click();
      }
      document.querySelector('[data-tab="generator"]').click();
      modelInput.focus();
    });
    actions.appendChild(useBtn);
    card.appendChild(actions);
    target.appendChild(card);
  }

  function init() {
    if (!window.DeviceCatalog) return;
    const nav = document.querySelector(".tab-bar");
    const main = document.querySelector(".main-content");
    if (!nav || !main) return;

    const tabButton = create("button", "tab-btn", "Aparelhos");
    tabButton.type = "button";
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", "false");
    tabButton.dataset.tab = "devices";
    nav.appendChild(tabButton);

    const panel = create("section", "tab-panel hidden");
    panel.id = "tab-devices";
    panel.setAttribute("role", "tabpanel");
    const card = create("div", "card device-catalog-card");
    const heading = create("div", "section-head");
    const headingText = create("div");
    headingText.appendChild(create("h2", "", "Catálogo técnico"));
    headingText.appendChild(create("p", "device-catalog-intro", "Banco local. Campos não confirmados aparecem explicitamente como pendentes."));
    heading.appendChild(headingText);
    const count = DeviceCatalog.getStats();
    heading.appendChild(create("span", "badge", count.total + " MODELO(S)"));
    card.appendChild(heading);

    const searchWrap = create("div", "field");
    const searchLabel = create("label", "", "Buscar marca, modelo ou código");
    searchLabel.htmlFor = "deviceCatalogSearch";
    const search = create("input", "input-control");
    search.id = "deviceCatalogSearch";
    search.type = "search";
    search.placeholder = "Ex.: Galaxy A07, SM-A075M";
    searchWrap.appendChild(searchLabel);
    searchWrap.appendChild(search);
    card.appendChild(searchWrap);

    const list = create("div", "device-results-list");
    const details = create("div", "device-details");
    card.appendChild(list);
    card.appendChild(details);
    panel.appendChild(card);
    main.appendChild(panel);

    function renderList() {
      list.innerHTML = "";
      const results = DeviceCatalog.search(search.value);
      if (!results.length) {
        list.appendChild(create("div", "empty-state", "Nenhum aparelho encontrado no banco offline. O modelo pode ser adicionado em uma atualização futura."));
        details.innerHTML = "";
        return;
      }
      results.forEach((device) => {
        const button = create("button", "device-result-item");
        button.type = "button";
        const label = create("span", "device-result-name", device.brand + " " + device.model);
        const sub = create("small", "", (device.chipset || "Chipset pendente") + " • " + (device.network || "Rede pendente"));
        button.appendChild(label);
        button.appendChild(sub);
        button.addEventListener("click", () => {
          list.querySelectorAll(".device-result-item").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          renderDetails(device, details);
        });
        list.appendChild(button);
      });
      const first = results[0];
      const firstButton = list.querySelector(".device-result-item");
      if (firstButton) firstButton.classList.add("active");
      renderDetails(first, details);
    }

    nav.querySelectorAll(".tab-btn:not([data-tab=\"devices\"])").forEach((button) => {\n      button.addEventListener("click", () => panel.classList.add("hidden"));\n    });\n\n    tabButton.addEventListener("click", () => {
      nav.querySelectorAll(".tab-btn").forEach((button) => {
        const active = button === tabButton;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      main.querySelectorAll(".tab-panel").forEach((section) => {
        section.classList.toggle("hidden", section !== panel);
      });
      renderList();
    });
    search.addEventListener("input", renderList);
  }

  document.addEventListener("DOMContentLoaded", init);
})();