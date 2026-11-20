(() => {
  "use strict";

  // Banco local versionado. null significa dado ainda não confirmado.
  const DEVICES = [
    {
      id: "samsung-galaxy-a07-4g-sm-a075m",
      brand: "Samsung",
      model: "Galaxy A07 4G",
      aliases: ["A07", "SM-A075M", "Galaxy A07"],
      chipset: "MediaTek Helio G99",
      processorTier: "intermediario",
      network: "4G LTE",
      ramVariantsGB: [],
      storageVariantsGB: [],
      display: { sizeInches: null, technology: null, resolution: null, refreshRateHz: null },
      battery: { capacityMah: null, chargingW: null },
      cameras: { rear: null, front: null },
      operatingSystemAtLaunch: null,
      sourceStatus: "parcial",
      sourceNote: "Chipset e conectividade identificados para esta variante. Outros campos permanecem não confirmados e não são estimados.",
      sensitivityDefaults: { ram: null, hz: null }
    }
  ];

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\\u0300-\\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function search(query) {
    const needle = normalize(query);
    if (!needle) return DEVICES.slice();
    return DEVICES.filter((device) => {
      const haystack = [device.brand, device.model, device.id, ...(device.aliases || [])]
        .map(normalize).join(" ");
      return haystack.includes(needle);
    });
  }

  function findById(id) {
    return DEVICES.find((device) => device.id === id) || null;
  }

  function getStats() {
    return {
      total: DEVICES.length,
      complete: DEVICES.filter((device) => device.sourceStatus === "completo").length,
      partial: DEVICES.filter((device) => device.sourceStatus === "parcial").length
    };
  }

  const api = { VERSION: "1.0.0", DEVICES, search, findById, getStats };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof globalThis !== "undefined") globalThis.DeviceCatalog = api;
})();