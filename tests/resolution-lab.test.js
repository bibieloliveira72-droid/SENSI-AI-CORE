import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "frontend/resolution-lab.js"), "utf8");
const context = {};
vm.runInNewContext(source, context);
const catalog = context.SensiResolutionLabCatalog.buildCatalog();

test("Resolution Lab oferece 400 opções offline, únicas e em proporções exatas", () => {
  assert.equal(catalog.length, 400);
  assert.equal(new Set(catalog.map((item) => item.id)).size, 400);
  const counts = new Map([["4:3", 0], ["16:9", 0], ["19.5:9", 0], ["20:9", 0]]);
  for (const item of catalog) {
    assert.ok(counts.has(item.ratio), "Proporção não cadastrada: " + item.ratio);
    counts.set(item.ratio, counts.get(item.ratio) + 1);
    assert.ok(Number.isInteger(item.width) && Number.isInteger(item.height));
    const [a, b] = item.ratio === "4:3" ? [4, 3]
      : item.ratio === "16:9" ? [16, 9]
      : item.ratio === "19.5:9" ? [13, 6] : [20, 9];
    assert.equal(item.width * b, item.height * a, item.id + " não corresponde a " + item.ratio);
    assert.ok(["reference", "calculated"].includes(item.source));
  }
  for (const [ratio, count] of counts) assert.equal(count, 100, ratio + " precisa ter 100 opções");
});

test("Referências cadastradas e dimensões conhecidas continuam presentes", () => {
  const ids = new Set(catalog.map((item) => item.id));
  for (const id of ["400x300", "960x720", "1400x1050", "1920x1080", "2340x1080", "2400x1080", "3200x1440"]) {
    assert.ok(ids.has(id), "Dimensão ausente: " + id);
  }
  assert.ok(catalog.some((item) => item.id === "960x720" && item.source === "reference"));
  assert.ok(catalog.some((item) => item.id === "1904x1071" && item.ratio === "16:9"));
});
