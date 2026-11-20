(function (root) {
  "use strict";

  const RATIOS = [
    {
      id: "4:3", label: "4:3 · Clássica", numerator: 4, denominator: 3,
      build: () => Array.from({ length: 100 }, (_, i) => {
        const width = 400 + i * 16 === 1392 ? 1400 : 400 + i * 16;
        return { width, height: width * 3 / 4 };
      }),
      references: ["400x300", "512x384", "640x480", "800x600", "832x624", "960x720", "1024x768", "1152x864", "1280x960", "1400x1050", "1440x1080", "1600x1200"]
    },
    {
      id: "16:9", label: "16:9 · Widescreen", numerator: 16, denominator: 9,
      build: () => Array.from({ length: 100 }, (_, i) => {
        const width = 640 + Math.round(i * 1920 / 99 / 16) * 16;
        return { width, height: width * 9 / 16 };
      }),
      references: ["640x360", "960x540", "1280x720", "1600x900", "1920x1080", "2560x1440"]
    },
    {
      id: "19.5:9", label: "19.5:9 · Tela ampla", numerator: 13, denominator: 6,
      build: () => Array.from({ length: 100 }, (_, i) => {
        const unit = 90 + Math.round(i * 150 / 99);
        return { width: 13 * unit, height: 6 * unit };
      }),
      references: ["2340x1080", "2600x1200", "3120x1440"]
    },
    {
      id: "20:9", label: "20:9 · Ultrawide", numerator: 20, denominator: 9,
      build: () => Array.from({ length: 100 }, (_, i) => {
        const unit = 40 + Math.round(i * 120 / 99);
        return { width: 20 * unit, height: 9 * unit };
      }),
      references: ["2400x1080", "2520x1134", "2800x1260", "3200x1440"]
    }
  ];

  function buildCatalog() {
    const rows = [];
    RATIOS.forEach((ratio) => {
      ratio.build().forEach(({ width, height }) => {
        const id = width + "x" + height;
        const reference = ratio.references.includes(id);
        rows.push({
          id,
          width,
          height,
          ratio: ratio.id,
          ratioLabel: ratio.label,
          source: reference ? "reference" : "calculated",
          sourceLabel: reference ? "Referência cadastrada" : "Variação calculada"
        });
      });
    });
    return rows;
  }

  root.SensiResolutionLabCatalog = Object.freeze({ buildCatalog });

  function init() {
    const doc = root.document;
    if (!doc) return;
    const byId = (id) => doc.getElementById(id);
    const els = {
      search: byId("rlSearch"), ratio: byId("rlRatioFilter"), source: byId("rlSourceFilter"),
      favoritesOnly: byId("rlFavoritesOnly"), count: byId("rlCountBadge"),
      selected: byId("rlSelectedResolution"), meta: byId("rlSelectedMeta"),
      preview: byId("rlPreviewShape"), copy: byId("rlCopyBtn"), favorite: byId("rlFavoriteBtn"),
      results: byId("rlResults"), summary: byId("rlResultsSummary"),
      favoriteCount: byId("rlFavoriteCount"), loadMore: byId("rlLoadMore")
    };
    if (Object.values(els).some((el) => !el)) return;

    const catalog = buildCatalog();
    const favoriteKey = "sensi_ai_resolution_lab_favorites_v1";
    let favorites = [];
    try {
      const parsed = JSON.parse(root.localStorage.getItem(favoriteKey) || "[]");
      favorites = Array.isArray(parsed) ? parsed.filter((id) => catalog.some((item) => item.id === id)) : [];
    } catch (_error) {
      favorites = [];
    }
    let selected = catalog.find((item) => item.id === "960x720") || catalog[0];
    let visibleLimit = 40;

    function persistFavorites() {
      try { root.localStorage.setItem(favoriteKey, JSON.stringify(favorites)); } catch (_error) {}
    }

    function copyText(value) {
      if (root.AndroidBridge && typeof root.AndroidBridge.copyText === "function") {
        root.AndroidBridge.copyText(value);
        return Promise.resolve(true);
      }
      if (root.navigator && root.navigator.clipboard && root.isSecureContext) {
        return root.navigator.clipboard.writeText(value).then(() => true);
      }
      const field = doc.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      doc.body.appendChild(field);
      field.select();
      const ok = doc.execCommand("copy");
      doc.body.removeChild(field);
      return Promise.resolve(ok);
    }

    function notify(message) {
      const toast = byId("toast");
      if (toast) {
        toast.textContent = message;
        toast.classList.remove("hidden");
      }
    }

    function updateSelected() {
      els.selected.textContent = selected.width + " × " + selected.height;
      els.meta.textContent = selected.ratio + " · " + selected.sourceLabel;
      els.preview.style.aspectRatio = selected.width + " / " + selected.height;
      els.preview.setAttribute("aria-label", "Prévia " + selected.ratio + " de " + selected.width + " por " + selected.height);
      const saved = favorites.includes(selected.id);
      els.favorite.textContent = saved ? "★ REMOVER FAVORITO" : "☆ SALVAR FAVORITO";
      els.favorite.setAttribute("aria-pressed", String(saved));
    }

    function filteredCatalog() {
      const query = els.search.value.trim().toLocaleLowerCase("pt-BR");
      return catalog.filter((item) => {
        if (els.ratio.value !== "all" && item.ratio !== els.ratio.value) return false;
        if (els.source.value !== "all" && item.source !== els.source.value) return false;
        if (els.favoritesOnly.checked && !favorites.includes(item.id)) return false;
        if (!query) return true;
        const haystack = [item.id, item.width + " × " + item.height, item.ratio, item.ratioLabel, item.sourceLabel].join(" ").toLocaleLowerCase("pt-BR");
        return haystack.includes(query);
      });
    }

    function render() {
      const filtered = filteredCatalog();
      const shown = filtered.slice(0, visibleLimit);
      els.results.innerHTML = "";
      shown.forEach((item) => {
        const card = doc.createElement("article");
        card.className = "rl-result-card" + (selected.id === item.id ? " selected" : "");
        const main = doc.createElement("button");
        main.type = "button";
        main.className = "rl-result-main";
        main.setAttribute("aria-label", "Selecionar " + item.width + " por " + item.height);
        const dimension = doc.createElement("strong");
        dimension.textContent = item.width + " × " + item.height;
        const details = doc.createElement("small");
        details.textContent = item.ratio + " · " + item.sourceLabel;
        main.append(dimension, details);
        main.addEventListener("click", () => { selected = item; updateSelected(); render(); });
        const star = doc.createElement("button");
        star.type = "button";
        star.className = "rl-star-btn";
        star.textContent = favorites.includes(item.id) ? "★" : "☆";
        star.setAttribute("aria-label", (favorites.includes(item.id) ? "Remover " : "Salvar ") + item.width + " por " + item.height + " " + "dos favoritos");
        star.setAttribute("aria-pressed", String(favorites.includes(item.id)));
        star.addEventListener("click", () => toggleFavorite(item.id));
        card.append(main, star);
        els.results.appendChild(card);
      });
      els.count.textContent = catalog.length + " OPÇÕES";
      els.summary.textContent = "Mostrando " + shown.length + " de " + filtered.length + " resultados";
      els.favoriteCount.textContent = favorites.length + " favoritos";
      els.loadMore.classList.toggle("hidden", shown.length >= filtered.length);
      updateSelected();
    }

    function toggleFavorite(id) {
      favorites = favorites.includes(id) ? favorites.filter((item) => item !== id) : favorites.concat(id);
      persistFavorites();
      render();
      notify(favorites.includes(id) ? "Resolução salva nos favoritos." : "Resolução removida dos favoritos.");
    }

    [els.search, els.ratio, els.source, els.favoritesOnly].forEach((control) => {
      control.addEventListener(control === els.search ? "input" : "change", () => {
        visibleLimit = 40;
        render();
      });
    });
    els.favorite.addEventListener("click", () => toggleFavorite(selected.id));
    els.copy.addEventListener("click", () => {
      copyText(selected.width + "x" + selected.height)
        .then((ok) => notify(ok ? "Resolução copiada!" : "Não foi possível copiar."));
    });
    els.loadMore.addEventListener("click", () => { visibleLimit += 40; render(); });
    render();
  }

  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
