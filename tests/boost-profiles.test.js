import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../frontend/boost.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../frontend/index.html", import.meta.url), "utf8");
const android = readFileSync(new URL("../app/src/main/java/com/example/MainActivity.kt", import.meta.url), "utf8");
const profileLiteral = js.match(/const recommended=(\{[\s\S]*?\});\nlet activeBoostProfile/);
assert.ok(profileLiteral, "Mapa de perfis precisa existir");
const profiles = Function("return (" + profileLiteral[1] + ")")();
const validActions = new Set(["animations","game","memory","thermal","battery","network","touch","display","storage","background","sound","privacy","report","refresh","notifications","updates","accessibility","massinha"]);

test("os cinco perfis possuem uma lista válida e a ação executável reversível", () => {
  for (const name of ["stable","cool","battery","network","balanced"]) {
    assert.ok(Array.isArray(profiles[name]), "Perfil ausente: " + name);
    assert.ok(profiles[name].includes("animations"), "Perfil sem ação executável: " + name);
    for (const key of profiles[name]) assert.ok(validActions.has(key), name + " contém ação desconhecida: " + key);
  }
});

test("os quatro cartões visuais apontam para perfis existentes", () => {
  const ids = [...html.matchAll(/data-boost-profile="([^"]+)"/g)].map(x => x[1]);
  assert.deepEqual(ids.sort(), ["balanced","battery","cool","stable"].sort());
  for (const id of ids) assert.ok(profiles[id]);
});

test("botão Aplicar Perfil está presente e ligado ao fluxo de confirmação", () => {
  assert.match(html, /id="boostApplyProfileBtn"/);
  assert.match(js, /\$\("boostApplyProfileBtn"\)\?\.addEventListener\("click",applySelectedBoostProfile\)/);
  assert.match(js, /function applySelectedBoostProfile\([\s\S]*?startApplyTweaks\(\)/);
});

test("ações nativas continuam protegidas por Shizuku, confirmação e backup", () => {
  assert.match(js, /getShizukuStatus/);
  assert.match(js, /boostConfirmModal/);
  assert.match(js, /applySafeTweak\("animations"\)/);
  assert.match(js, /applyMassinhaTweak\(version,pkg\)/);
  assert.match(js, /restoreSafeTweak/);
  assert.match(js, /restoreMassinhaTweak/);
});

test("todas as opções do Boost possuem uma ação ligada", () => {
  const literal = js.match(/const guideActionLabels=(\{[\s\S]*?\});/);
  assert.ok(literal, "Mapa de ações do Boost precisa existir");
  const actions = Function("return (" + literal[1] + ")")();
  for (const key of validActions) assert.ok(actions[key], "Ação sem botão: " + key);
  assert.match(js, /function runGuideAction\(key\)/);
  assert.match(js, /button.addEventListener\("click",\(\)=>runGuideAction\(k\)\)/);
});

test("atalhos nativos usam telas oficiais do Android e não encerram apps", () => {
  for (const key of ["battery","network","display","touch","storage","background","memory","sound","privacy","notifications","updates","accessibility"]) {
    assert.match(android, new RegExp('"' + key + '"'));
  }
  assert.match(android, /ACTION_ALL_APPS_NOTIFICATION_SETTINGS/);
  assert.match(android, /ACTION_MANAGE_APPLICATIONS_SETTINGS/);
  assert.doesNotMatch(js, /am force-stop.*(spotify|com\.spotify)/i);
});

test("o plano é montado antes de verificar Shizuku para não bloquear os atalhos", () => {
  assert.match(js, /function startApplyTweaks\(\)[\s\S]*?buildPlan\(\);[\s\S]*?getShizukuStatus/);
});
