import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
const ANDROID_WEB_DIR = path.resolve(__dirname, "../app/src/main/assets/web");

function loadEngine() {
  const code = fs.readFileSync(path.join(FRONTEND_DIR, "sensi-engine.js"), "utf8");
  const context = { globalThis: {} };
  vm.runInNewContext(code, context);
  return context.globalThis.SensiEngine;
}

test("Frontend e assets APK são 100% offline, sem fetch, sem XHR, sem URLs externas e sem Math.random", () => {
  for (const dir of [FRONTEND_DIR, ANDROID_WEB_DIR]) {
    const files = fs.readdirSync(dir);
    assert.ok(files.includes("index.html"));
    assert.ok(files.includes("styles.css"));
    assert.ok(files.includes("sensi-engine.js"));
    assert.ok(files.includes("app.js"));

    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), "utf8");
      assert.equal(/\bfetch\s*\(/.test(content), false, `fetch() proibido encontrado em ${file}`);
      assert.equal(/XMLHttpRequest/.test(content), false, `XMLHttpRequest proibido em ${file}`);
      assert.equal(/Math\.random/.test(content), false, `Math.random proibido em ${file}`);
      assert.equal(/https?:\/\//i.test(content), false, `URL externa encontrada em ${file}`);
      assert.equal(/GEMINI_API_KEY/i.test(content), false, `Referência a API key em ${file}`);
    }
  }
});

test("Motor gera exatamente os mesmos valores para a mesma entrada (determinístico)", () => {
  const engine = loadEngine();
  const input = {
    marca: "Xiaomi",
    modelo: "Poco X6 Pro",
    processador: "flagship",
    ram: 12,
    dpi: 600,
    hz: 120,
    fireButtonSize: 48,
    profile: "capa",
  };

  const r1 = engine.generateSensitivity(input);
  const r2 = engine.generateSensitivity(input);
  assert.deepEqual(r1.values, r2.values);

  for (const scope of engine.SCOPE_KEYS) {
    assert.equal(Number.isInteger(r1.values[scope]), true);
    assert.ok(r1.values[scope] >= 0 && r1.values[scope] <= 200);
  }
});

test("Motor usa DPI e botão como parâmetros de ajuste, sem inventar relação entre hardware e sensibilidade", () => {
  const engine = loadEngine();
  const base = {
    marca: "Samsung",
    modelo: "Galaxy A55",
    processador: "intermediario_plus",
    ram: 8,
    dpi: 411,
    hz: 120,
    fireButtonSize: 50,
    profile: "capa",
  };

  const lowDpi = engine.generateSensitivity({ ...base, dpi: 411 });
  const highDpi = engine.generateSensitivity({ ...base, dpi: 960 });
  assert.ok(lowDpi.values.General > highDpi.values.General, "DPI maior deve reduzir sensibilidade base");

  const hardwareVariant = engine.generateSensitivity({ ...base, ram: 16, hz: 165, processador: "flagship", marca: "Apple", modelo: "iPhone 17 Pro" });
  assert.deepEqual(hardwareVariant.values, engine.generateSensitivity(base).values, "Hardware não deve alterar números de sensibilidade sem medição de toque");

  const smallBtn = engine.generateSensitivity({ ...base, fireButtonSize: 35 });
  const largeBtn = engine.generateSensitivity({ ...base, fireButtonSize: 78 });
  assert.ok(largeBtn.values["Red Dot"] > smallBtn.values["Red Dot"]);

  const capa = engine.generateSensitivity({ ...base, profile: "capa" });
  const precisao = engine.generateSensitivity({ ...base, profile: "precisao" });
  const agressivo = engine.generateSensitivity({ ...base, profile: "agressivo" });
  assert.ok(agressivo.values.Olhadinha > precisao.values.Olhadinha);
  assert.ok(capa.values["Red Dot"] > precisao.values["Red Dot"]);
});

test("Ajuste de 1 em 1 ponto e calibração adaptativa respeitam os limites válidos (0..200)", () => {
  const engine = loadEngine();
  let vals = {
    General: 199,
    "Red Dot": 1,
    "2x": 150,
    "4x": 140,
    AWM: 90,
    Olhadinha: 160,
  };

  vals = engine.adjustSingleScope(vals, "General", 1);
  assert.equal(vals.General, 200);
  vals = engine.adjustSingleScope(vals, "General", 1);
  assert.equal(vals.General, 200);

  vals = engine.adjustSingleScope(vals, "Red Dot", -1);
  assert.equal(vals["Red Dot"], 0);
  vals = engine.adjustSingleScope(vals, "Red Dot", -1);
  assert.equal(vals["Red Dot"], 0);

  const overshoot = engine.applyAdaptiveCalibration(
    { General: 180, "Red Dot": 175, "2x": 160, "4x": 145, AWM: 90, Olhadinha: 150 },
    "overshoot_head",
    { dpi: 600, fireButtonSize: 52, calibrationSteps: 0 }
  );
  assert.ok(overshoot.values["Red Dot"] < 175);
  assert.ok(overshoot.values.General < 180);

  const stuck = engine.applyAdaptiveCalibration(overshoot.values, "stuck_chest", {
    dpi: 600,
    fireButtonSize: 70,
    calibrationSteps: 1,
  });
  assert.ok(stuck.values["Red Dot"] > overshoot.values["Red Dot"]);
});

test("Comparação calcula diferenças exatas por mira", () => {
  const engine = loadEngine();
  const a = engine.generateSensitivity({
    marca: "Motorola",
    modelo: "Moto G84",
    processador: "intermediario",
    ram: 8,
    dpi: 520,
    hz: 120,
    fireButtonSize: 52,
    profile: "precisao",
  });
  const b = engine.generateSensitivity({
    marca: "Motorola",
    modelo: "Moto G84",
    processador: "intermediario",
    ram: 8,
    dpi: 520,
    hz: 120,
    fireButtonSize: 52,
    profile: "agressivo",
  });

  const cmp = engine.compareConfigurations(a, b);
  assert.equal(cmp.rows.length, 6);
  const genRow = cmp.rows.find((r) => r.scope === "General");
  assert.equal(genRow.diff, b.values.General - a.values.General);
});


test("Catálogo de aparelhos cobre as 18 marcas do seletor, sem modelos duplicados", () => {
  const app = fs.readFileSync(path.join(FRONTEND_DIR, "app.js"), "utf8");
  const catalogStart = app.indexOf("  const DEVICE_CATALOG = [");
  const catalogEnd = app.indexOf("\n  ].map", catalogStart);
  assert.ok(catalogStart >= 0 && catalogEnd > catalogStart, "Catálogo de dispositivos não encontrado");
  const arrayStart = app.indexOf("[", catalogStart);
  const entries = vm.runInNewContext("(" + app.slice(arrayStart, catalogEnd + 4).trim() + ")");
  const brands = ["Google","OPPO","vivo","Tecno","HONOR","Nothing","Sony","ZTE Nubia","Lenovo Legion","Huawei","Motorola","Xiaomi","Samsung","Apple","ASUS ROG","Realme","Infinix","OnePlus"];
  const counts = new Map(brands.map((brand) => [brand, 0]));
  const seen = new Set();
  for (const [brand, model] of entries) {
    assert.ok(counts.has(brand), "Marca fora do seletor: " + brand);
    assert.ok(model.trim().length > 0);
    const key = brand.toLocaleLowerCase("pt-BR") + "|" + model.toLocaleLowerCase("pt-BR");
    assert.equal(seen.has(key), false, "Modelo duplicado: " + key);
    seen.add(key);
    counts.set(brand, counts.get(brand) + 1);
  }
  for (const [brand, count] of counts) {
    assert.ok(count >= 5, brand + " precisa ter pelo menos 5 modelos no catálogo");
  }
  assert.ok(entries.length >= 250, "Catálogo deve conter pelo menos 250 modelos");
});


test("Autopreenchimento de ficha técnica inclui Galaxy A07 4G e valida dados suportados", () => {
  const app = fs.readFileSync(path.join(FRONTEND_DIR, "app.js"), "utf8");
  const match = app.match(/const DEVICE_SPECS = \{([\s\S]*?)\n  \};/);
  assert.ok(match, "Tabela de especificações dos dispositivos não encontrada");
  const specs = vm.runInNewContext("({" + match[1] + "})");
  const a07 = specs["Samsung|Galaxy A07 4G"];
  assert.ok(a07, "Galaxy A07 4G precisa ter ficha técnica");
  assert.equal(a07.chipset, "MediaTek Helio G99");
  assert.equal(a07.category, "intermediario");
  assert.equal(a07.hz, 90);
  for (const [device, item] of Object.entries(specs)) {
    assert.ok(["flagship", "intermediario_plus", "intermediario", "entrada"].includes(item.category), device + " tem categoria inválida");
    assert.ok([2, 3, 4, 6, 8, 12, 16].includes(item.ram), device + " tem RAM fora das opções");
    assert.ok([60, 90, 120, 144, 165, 185].includes(item.hz), device + " tem Hz fora das opções");
    assert.ok(item.chipset && item.chipset.length > 2, device + " sem chipset");
  }
  assert.match(app, /applyCatalogDeviceSpecs\(device\)/);
  assert.match(app, /selectChipValue\(els\.ramChips, els\.ramInput, specs\.ram\)/);
  assert.match(app, /selectChipValue\(els\.hzChips, els\.hzInput, specs\.hz\)/);
});

test("Aprendizado local reduz o passo em correções repetidas por mira e mantém miras independentes", () => {
  const engine = loadEngine();
  const initial = { General: 160, "Red Dot": 160, "2x": 150, "4x": 140, AWM: 90, Olhadinha: 150 };
  const first = engine.applyAdaptiveCalibration(initial, "overshoot_head", { learningState: {} });
  const second = engine.applyAdaptiveCalibration(first.values, "overshoot_head", { learningState: first.learningState });
  assert.ok(Math.abs(second.deltas.General) <= Math.abs(first.deltas.General));
  assert.ok(Math.abs(second.deltas["Red Dot"]) <= Math.abs(first.deltas["Red Dot"]));
  assert.equal(second.deltas.AWM, 0);
  assert.equal(second.deltas["4x"], 0);
  assert.equal(second.learningState.AWM.sameDirectionCount, 0);
});



test("Motor híbrido 2.0 oferece modos Controle, Balanceado e Ágil", () => {
  const engine = loadEngine();
  const base = { marca: "Samsung", modelo: "Galaxy A07 4G", dpi: 600, fireButtonSize: 52, profile: "equilibrado" };
  const control = engine.generateSensitivity({ ...base, engineMode: "controle" });
  const balanced = engine.generateSensitivity({ ...base, engineMode: "balanceado" });
  const agile = engine.generateSensitivity({ ...base, engineMode: "agil" });
  assert.ok(agile.values.General > balanced.values.General);
  assert.ok(control.values["4x"] < balanced.values["4x"]);
  assert.equal(control.engineMode, "controle");
  for (const result of [control, balanced, agile]) for (const key of engine.SCOPE_KEYS) assert.ok(result.values[key] >= 0 && result.values[key] <= 200);
});

test("Personalização direta altera somente a mira selecionada", () => {
  const engine = loadEngine();
  const initial = { General: 150, "Red Dot": 140, "2x": 130, "4x": 120, AWM: 80, Olhadinha: 110 };
  const next = engine.setScopeValue(initial, "4x", 177);
  assert.equal(next["4x"], 177);
  for (const key of engine.SCOPE_KEYS.filter((key) => key !== "4x")) assert.equal(next[key], initial[key]);
  assert.equal(engine.setScopeValue(initial, "4x", 999)["4x"], 200);
  assert.throws(() => engine.setScopeValue(initial, "invalid", 100));
});


test("Boost Center inclui diagnóstico e solicitação explícita de permissão Shizuku", () => {
  const html = fs.readFileSync(path.join(FRONTEND_DIR, "index.html"), "utf8");
  const boost = fs.readFileSync(path.join(FRONTEND_DIR, "boost.js"), "utf8");
  const native = fs.readFileSync(path.join(__dirname, "../app/src/main/java/com/example/MainActivity.kt"), "utf8");
  assert.match(html, /id="tab-boost"/);
  assert.match(html, /id="shizukuGrantBtn"/);
  assert.match(boost, /getDeviceSnapshot/);
  assert.match(boost, /requestShizukuPermission/);
  assert.match(native, /Shizuku\.requestPermission/);
  assert.match(native, /getDeviceSnapshot/);
});


test("Motor recomenda resolução e DPI por classe de hardware sem aplicar alterações", () => {
  const engine = loadEngine();
  const entry = engine.recommendDisplaySetup({ processador: "entrada", ram: 3 });
  const mid = engine.recommendDisplaySetup({ processador: "intermediario", ram: 8 });
  const high = engine.recommendDisplaySetup({ processador: "flagship", ram: 12 });
  assert.equal(entry.resolution, "960 × 720");
  assert.match(entry.resolutionLabel, /4:3/);
  assert.equal(entry.dpi, 420);
  assert.equal(mid.resolution, "1280 × 960");
  assert.equal(mid.dpi, 480);
  assert.equal(high.resolution, "1440 × 1080");
  assert.equal(high.dpi, 560);
  assert.match(entry.note, /4:3/);
  assert.match(entry.note, /não altera/i);
});
