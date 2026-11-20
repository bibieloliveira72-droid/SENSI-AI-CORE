(function (root) {
  "use strict";

  function buildEvenSamples(min, max, count, required) {
    const values = Array.from({ length: count }, function (_, i) {
      return min + Math.round(i * (max - min) / (count - 1));
    });
    const protectedValues = new Set(required);
    required.forEach(function (target) {
      if (values.includes(target)) return;
      let bestIndex = -1;
      let bestDistance = Infinity;
      values.forEach(function (value, index) {
        if (protectedValues.has(value)) return;
        const distance = Math.abs(value - target);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      if (bestIndex >= 0) values[bestIndex] = target;
    });
    return values.sort(function (a, b) { return a - b; });
  }

  const RATIOS = [
    {
      id: "4:3", label: "4:3 · Clássica",
      build: function () {
        return Array.from({ length: 100 }, function (_, i) {
          const rawWidth = 400 + i * 16;
          const width = rawWidth === 1392 ? 1400 : rawWidth;
          return { width: width, height: Math.round(width * 3 / 4) };
        });
      },
      references: ["400x300", "512x384", "640x480", "800x600", "832x624", "960x720", "1024x768", "1152x864", "1280x960", "1400x1050", "1440x1080", "1600x1200"]
    },
    {
      id: "16:9", label: "16:9 · Widescreen",
      build: function () {
        return buildEvenSamples(40, 160, 100, [40, 60, 80, 100, 120, 160]).map(function (unit) {
          const width = unit * 16;
          return { width: width, height: unit * 9 };
        });
      },
      references: ["640x360", "960x540", "1280x720", "1600x900", "1920x1080", "2560x1440"]
    },
    {
      id: "19.5:9", label: "19.5:9 · Tela ampla",
      build: function () {
        return buildEvenSamples(90, 240, 100, [180, 200, 240]).map(function (unit) {
          return { width: 13 * unit, height: 6 * unit };
        });
      },
      references: ["2340x1080", "2600x1200", "3120x1440"]
    },
    {
      id: "20:9", label: "20:9 · Ultrawide",
      build: function () {
        return buildEvenSamples(40, 160, 100, [120, 126, 140, 160]).map(function (unit) {
          return { width: 20 * unit, height: 9 * unit };
        });
      },
      references: ["2400x1080", "2520x1134", "2800x1260", "3200x1440"]
    }
  ];

  function buildCatalog() {
    const rows = [];
    RATIOS.forEach(function (ratio) {
      ratio.build().forEach(function (dimension) {
        const id = dimension.width + "x" + dimension.height;
        const reference = ratio.references.includes(id);
        rows.push({
          id: id,
          width: dimension.width,
          height: dimension.height,
          ratio: ratio.id,
          ratioLabel: ratio.label,
          source: reference ? "reference" : "calculated",
          sourceLabel: reference ? "Referência cadastrada" : "Variação calculada"
        });
      });
    });
    return rows;
  }

  root.SensiResolutionLabCatalog = Object.freeze({ buildCatalog: buildCatalog });

  function init() {
    const doc = root.document;
    if (!doc || root.__sensiResolutionLabInitialized) return;

    const byId = function (id) { return doc.getElementById(id); };
    const els = {
      search: byId("rlSearch"),
      ratio: byId("rlRatioFilter"),
      source: byId("rlSourceFilter"),
      favoritesOnly: byId("rlFavoritesOnly"),
      count: byId("rlCountBadge"),
      selected: byId("rlSelectedResolution"),
      meta: byId("rlSelectedMeta"),
      preview: byId("rlPreviewShape"),
      copy: byId("rlCopyBtn"),
      favorite: byId("rlFavoriteBtn"),
      results: byId("rlResults"),
      summary: byId("rlResultsSummary"),
      favoriteCount: byId("rlFavoriteCount"),
      loadMore: byId("rlLoadMore")
    };

    if (Object.keys(els).some(function (key) { return !els[key]; })) {
      if (root.console && root.console.warn) root.console.warn("SENSI.AI: elementos do Resolution Lab não encontrados.");
      return;
    }

    root.__sensiResolutionLabInitialized = true;
    const catalog = buildCatalog();
    const favoriteKey = "sensi_ai_resolution_lab_favorites_v1";
    let favorites = [];
    let selected = catalog.find(function (item) { return item.id === "960x720"; }) || catalog[0];
    let visibleLimit = 40;

    function readFavorites() {
      try {
        const parsed = JSON.parse(root.localStorage.getItem(favoriteKey) || "[]");
        return Array.isArray(parsed) ? parsed.filter(function (id) {
          return catalog.some(function (item) { return item.id === id; });
        }) : [];
      } catch (_error) {
        return [];
      }
    }

    favorites = readFavorites();

    function notify(message) {
      const toast = byId("toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.remove("hidden");
      toast.setAttribute("aria-live", "polite");
    }

    function persistFavorites() {
      try {
        root.localStorage.setItem(favoriteKey, JSON.stringify(favorites));
      } catch (_error) {
        notify("Favoritos disponíveis apenas durante esta sessão.");
      }
    }

    function fallbackCopy(value) {
      const field = doc.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      field.style.pointerEvents = "none";
      doc.body.appendChild(field);
      field.select();
      let ok = false;
      try { ok = doc.execCommand("copy"); } catch (_error) { ok = false; }
      doc.body.removeChild(field);
      return Promise.resolve(ok);
    }

    function copyText(value) {
      try {
        if (root.AndroidBridge && typeof root.AndroidBridge.copyText === "function") {
          root.AndroidBridge.copyText(value);
          return Promise.resolve(true);
        }
      } catch (_error) {}
      if (root.navigator && root.navigator.clipboard && root.isSecureContext) {
        return root.navigator.clipboard.writeText(value).then(function () { return true; }).catch(function () {
          return fallbackCopy(value);
        });
      }
      return fallbackCopy(value);
    }

    function updateSelected() {
      if (!selected) return;
      els.selected.textContent = selected.width + " × " + selected.height;
      els.meta.textContent = selected.ratio + " · " + selected.sourceLabel;
      els.preview.style.aspectRatio = selected.width + " / " + selected.height;
      els.preview.setAttribute("aria-label", "Prévia " + selected.ratio + " de " + selected.width + " por " + selected.height);
      const saved = favorites.includes(selected.id);
      els.favorite.textContent = saved ? "★ REMOVER FAVORITO" : "☆ SALVAR FAVORITO";
      els.favorite.setAttribute("aria-pressed", String(saved));
    }

    function filteredCatalog() {
      const query = els.search.value.trim().toLocaleLowerCase("pt-BR").replace(/[×X]/g, "x").replace(/\s+/g, "");
      return catalog.filter(function (item) {
        if (els.ratio.value !== "all" && item.ratio !== els.ratio.value) return false;
        if (els.source.value !== "all" && item.source !== els.source.value) return false;
        if (els.favoritesOnly.checked && !favorites.includes(item.id)) return false;
        if (!query) return true;
        const searchable = (item.id + item.ratio + item.ratioLabel + item.sourceLabel).toLocaleLowerCase("pt-BR").replace(/\s+/g, "");
        return searchable.includes(query);
      });
    }

    function render() {
      const filtered = filteredCatalog();
      const shown = filtered.slice(0, visibleLimit);
      const fragment = doc.createDocumentFragment();
      els.results.textContent = "";

      shown.forEach(function (item) {
        const card = doc.createElement("article");
        card.className = "rl-result-card" + (selected && selected.id === item.id ? " selected" : "");

        const main = doc.createElement("button");
        main.type = "button";
        main.className = "rl-result-main";
        main.setAttribute("aria-label", "Selecionar " + item.width + " por " + item.height);

        const dimension = doc.createElement("strong");
        dimension.textContent = item.width + " × " + item.height;
        const details = doc.createElement("small");
        details.textContent = item.ratio + " · " + item.sourceLabel;
        main.append(dimension, details);
        main.addEventListener("click", function () {
          selected = item;
          render();
        });

        const star = doc.createElement("button");
        star.type = "button";
        star.className = "rl-star-btn";
        star.textContent = favorites.includes(item.id) ? "★" : "☆";
        star.setAttribute("aria-label", (favorites.includes(item.id) ? "Remover " : "Salvar ") + item.width + " por " + item.height + " dos favoritos");
        star.setAttribute("aria-pressed", String(favorites.includes(item.id)));
        star.addEventListener("click", function () { toggleFavorite(item.id); });

        card.append(main, star);
        fragment.appendChild(card);
      });

      if (!shown.length) {
        const empty = doc.createElement("div");
        empty.className = "rl-empty-state";
        empty.textContent = "Nenhuma resolução encontrada. Tente outra dimensão ou remova os filtros.";
        fragment.appendChild(empty);
      }

      els.results.appendChild(fragment);
      els.count.textContent = catalog.length + " OPÇÕES";
      els.summary.textContent = "Mostrando " + shown.length + " de " + filtered.length + " resultados";
      els.favoriteCount.textContent = favorites.length + " favoritos";
      els.loadMore.classList.toggle("hidden", shown.length >= filtered.length);
      updateSelected();
    }

    function toggleFavorite(id) {
      favorites = favorites.includes(id)
        ? favorites.filter(function (item) { return item !== id; })
        : favorites.concat(id);
      persistFavorites();
      render();
      notify(favorites.includes(id) ? "Resolução salva nos favoritos." : "Resolução removida dos favoritos.");
    }

    [els.search, els.ratio, els.source, els.favoritesOnly].forEach(function (control) {
      control.addEventListener(control === els.search ? "input" : "change", function () {
        visibleLimit = 40;
        render();
      });
    });

    els.favorite.addEventListener("click", function () { toggleFavorite(selected.id); });
    els.copy.addEventListener("click", function () {
      copyText(selected.width + "x" + selected.height).then(function (ok) {
        notify(ok ? "Resolução copiada!" : "Não foi possível copiar.");
      });
    });
    els.loadMore.addEventListener("click", function () {
      visibleLimit += 40;
      render();
    });

    render();
  }

  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
