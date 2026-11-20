(() => {
  "use strict";

  const PENDING = "Não cadastrado / requer confirmação da variante";
  const style = document.createElement("style");
  style.textContent = `
    .device-sheet-trigger{border:1px solid #8b3038;background:#211014;color:#ffdce0;border-radius:10px;padding:9px 12px;font:700 11px/1.2 inherit;letter-spacing:.06em;cursor:pointer}
    .device-sheet-trigger:focus-visible,.device-sheet-close:focus-visible{outline:2px solid #ff6673;outline-offset:3px}
    .device-tech-sheet{margin:12px 0 4px;padding:16px;border:1px solid #633039;border-radius:16px;background:linear-gradient(145deg,#171014,#0d0d12);color:#f4edf0}
    .device-tech-sheet[hidden]{display:none}
    .device-tech-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
    .device-tech-head h3{margin:0 0 5px;font-size:16px}
    .device-tech-head p{margin:0;color:#bba8ae;font-size:12px;line-height:1.45}
    .device-sheet-close{border:1px solid #603039;background:#211014;color:#f8dce0;border-radius:9px;padding:7px 10px;cursor:pointer}
    .device-tech-status{display:inline-flex;margin:0 0 12px;padding:5px 8px;border-radius:999px;background:#392027;color:#ffb8c0;font-size:10px;font-weight:800;letter-spacing:.07em}
    .device-tech-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .device-tech-item{min-width:0;padding:10px;border:1px solid #30242a;border-radius:11px;background:#121116}
    .device-tech-item small{display:block;margin-bottom:5px;color:#ad969e;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    .device-tech-item strong{display:block;overflow-wrap:anywhere;color:#fff;font-size:12px;line-height:1.4}
    .device-tech-note{margin:12px 0 0;color:#bba8ae;font-size:11px;line-height:1.5}
    @media(max-width:420px){.device-tech-grid{grid-template-columns:1fr}.device-sheet-trigger{padding:8px 9px;font-size:10px}}
  `;
  document.head.appendChild(style);

  function byId(id) { return document.getElementById(id); }
  function makeItem(label, value) {
    const item = document.createElement("div");
    item.className = "device-tech-item";
    const caption = document.createElement("small");
    caption.textContent = label;
    const content = document.createElement("strong");
    content.textContent = value || PENDING;
    item.append(caption, content);
    return item;
  }

  function init() {
    const selectedCard = byId("selectedDeviceCard");
    const selectedName = byId("selectedDeviceName");
    const selectedMeta = byId("selectedDeviceMeta");
    if (!selectedCard || !selectedName || !selectedMeta) return;

    const changeButton = byId("changeDeviceBtn");
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "device-sheet-trigger";
    trigger.textContent = "FICHA TÉCNICA";
    trigger.setAttribute("aria-expanded", "false");
    if (changeButton) selectedCard.insertBefore(trigger, changeButton);
    else selectedCard.appendChild(trigger);

    const panel = document.createElement("section");
    panel.className = "device-tech-sheet";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Ficha técnica do dispositivo");
    selectedCard.insertAdjacentElement("afterend", panel);

    function render() {
      const model = selectedName.textContent.trim() || "Modelo não identificado";
      const meta = selectedMeta.textContent.trim();
      const brand = meta.split("·")[0].trim() || "Fabricante não identificado";
      const notCatalogued = /ficha técnica não cadastrada/i.test(meta);
      const chipset = byId("processadorDetalheInput")?.value.trim();
      const categorySelect = byId("processadorSelect");
      const category = categorySelect?.selectedOptions?.[0]?.textContent?.trim();
      const ram = byId("ramInput")?.value;
      const hz = byId("hzInput")?.value;
      const confirmedChipset = !notCatalogued && chipset ? chipset : PENDING;
      const confirmedCategory = !notCatalogued && category ? category : PENDING;
      const referenceRam = !notCatalogued && ram ? ram + " GB (configuração de referência)" : PENDING;
      const referenceHz = !notCatalogued && hz ? hz + " Hz (configuração de referência)" : PENDING;

      panel.replaceChildren();
      const head = document.createElement("div");
      head.className = "device-tech-head";
      const headingWrap = document.createElement("div");
      const title = document.createElement("h3");
      title.textContent = "Ficha técnica";
      const subtitle = document.createElement("p");
      subtitle.textContent = brand + " · " + model;
      headingWrap.append(title, subtitle);
      const close = document.createElement("button");
      close.type = "button";
      close.className = "device-sheet-close";
      close.textContent = "FECHAR";
      close.addEventListener("click", () => {
        panel.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      });
      head.append(headingWrap, close);

      const status = document.createElement("div");
      status.className = "device-tech-status";
      status.textContent = notCatalogued ? "FICHA EM CADASTRO · DADOS NÃO VERIFICADOS" : "FICHA PARCIAL · CONFIRME A VARIANTE";
      const grid = document.createElement("div");
      grid.className = "device-tech-grid";
      const fields = [
        ["Fabricante", brand],
        ["Modelo", model],
        ["Chipset / SoC", confirmedChipset],
        ["Categoria do hardware", confirmedCategory],
        ["Memória RAM", referenceRam],
        ["Taxa de atualização", referenceHz],
        ["CPU · núcleos e frequência", PENDING],
        ["GPU · modelo e recursos", PENDING],
        ["Tela · painel e resolução", PENDING],
        ["Armazenamento", PENDING],
        ["Bateria e carregamento", PENDING],
        ["Câmeras", PENDING],
        ["Sistema e interface", PENDING],
        ["Conectividade", PENDING]
      ];
      fields.forEach(([label, value]) => grid.appendChild(makeItem(label, value)));

      const note = document.createElement("p");
      note.className = "device-tech-note";
      note.textContent = "Os dados de RAM e Hz são referências de configuração, não garantem a variante instalada. Modelos podem ter diferenças por país, operadora e SKU. Campos sem confirmação permanecem identificados como pendentes. A ficha funciona offline e não consulta servidores.";
      panel.append(head, status, grid, note);
    }

    trigger.addEventListener("click", () => {
      const opening = panel.hidden;
      render();
      panel.hidden = !opening;
      trigger.setAttribute("aria-expanded", String(opening));
      if (opening) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();