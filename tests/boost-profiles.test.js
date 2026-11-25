import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const js = readFileSync(new URL("../frontend/boost.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../frontend/index.html", import.meta.url), "utf8");
const android = readFileSync(new URL("../app/src/main/java/com/example/MainActivity.kt", import.meta.url), "utf8");
const safeService = readFileSync(new URL("../app/src/main/java/com/example/SafeTweakUserService.kt", import.meta.url), "utf8");
const profileLiteral = js.match(/const recommended=(\{[\s\S]*?\});\nlet activeBoostProfile/);
assert.ok(profileLiteral, "Mapa de perfis precisa existir");
const profiles = Function("return (" + profileLiteral[1] + ")")();
const validActions = new Set(["animations","game","gameMode","shader","refreshRate","memory","thermal","battery","network","touch","display","storage","background","sound","privacy","report","refresh","notifications","updates","accessibility","massinha"]);

test("os perfis possuem ações válidas", () => {
  for (const name of ["stable","cool","battery","network","balanced"]) {
    assert.ok(Array.isArray(profiles[name]), "Perfil ausente: " + name);
    assert.ok(profiles[name].includes("animations"), "Perfil sem ação executável: " + name);
    for (const key of profiles[name]) assert.ok(validActions.has(key), name + " contém ação desconhecida: " + key);
  }
});

test("Brevent fica restrito aos Gráficos Massinha V1/V2", () => {
  assert.match(html, /id="tab-boost"/);
  assert.match(html, /id="boostApplyTweaks"/);
  assert.match(html, /id="massinhaExecutionMode"/);
  assert.match(html, /id="massinhaCommandV1"/);
  assert.match(html, /id="massinhaCommandV2"/);
  assert.match(html, /id="massinhaCopyV1"/);
  assert.match(html, /id="massinhaCopyV2"/);
  assert.match(html, /value="shizuku"/);
  assert.match(html, /value="brevent"/);
  assert.match(html, /id="breventCommandOutput"/);
  assert.match(js, /function breventScript\(/);
  assert.match(js, /massinhaExecutionMode==="brevent"/);
  assert.match(js, /copyBreventCommand/);
  assert.match(js, /Somente o Gráfico Massinha será enviado ao Brevent/);
});

test("Shizuku executa os módulos em segundo plano e informa o resultado", () => {
  assert.match(js, /function runNativeTweak\(/);
  assert.match(js, /await runNativeTweak\(/);
  assert.match(js, /window\.__sensiNativeResult/);
  assert.match(android, /fun runTweakAsync/);
  for (const op of ["animations","game","gameMode","shader","refreshRate","massinha"]) {
    assert.ok(android.includes('"'+op+'" ->'), "Operação nativa ausente: " + op);
  }
  assert.match(android, /unbindUserService\(args, connection, false\)/);
});

test("o jogo escolhido é aberto após operações confirmadas", () => {
  assert.match(js, /openFreeFire\(false,pkg==="com\.dts\.freefiremax"\?"freefiremax":"freefire"\)/);
});

test("ações nativas mantêm confirmação e restauração", () => {
  assert.match(js, /boostConfirmModal/);
  assert.match(js, /restoreSafeTweak/);
  assert.match(js, /restoreMassinhaTweak/);
  assert.match(js, /restoreBenimaruRefreshRate/);
  assert.match(js, /restoreBenimaruShaderDriver/);
});

test("todas as opções do Boost possuem uma ação ligada", () => {
  const literal = js.match(/const guideActionLabels=(\{[\s\S]*?\});/);
  assert.ok(literal, "Mapa de ações do Boost precisa existir");
  const actions = Function("return (" + literal[1] + ")")();
  for (const key of validActions) assert.ok(actions[key], "Ação sem botão: " + key);
  assert.match(js, /function runGuideAction\(key\)/);
  assert.match(js, /button.addEventListener\("click",\(\)=>runGuideAction\(k\)\)/);
});

test("atalhos nativos usam telas oficiais do Android e não encerram Spotify", () => {
  for (const key of ["battery","network","display","touch","storage","background","memory","sound","privacy","notifications","updates","accessibility"]) {
    assert.match(android, new RegExp('"'+key+'"'));
  }
  assert.match(android, /ACTION_ALL_APPS_NOTIFICATION_SETTINGS/);
  assert.match(android, /ACTION_MANAGE_APPLICATIONS_SETTINGS/);
  assert.doesNotMatch(js, /am force-stop.*(spotify|com\.spotify)/i);
});

test("comandos Massinha V1/V2 usam os parâmetros exatos e encerram somente o Free Fire escolhido", () => {
  assert.match(js, /disableAnisotropicFiltering:forceTextureLodOffset4/);
  assert.match(js, /forceNearestFiltering:disableAnisotropicFiltering:forceTextureLodOffset4/);
  assert.match(js, /am force-stop \"\+pkg/);
  assert.match(js, /function detectMassinhaDevice\(/);
  assert.match(android, /freeFireInstalled/);
  assert.match(android, /freeFireMaxInstalled/);
});


test("otimizador oferece seleção universal de jogos e mantém Massinha exclusivo do Free Fire", () => {
  for (const pkg of ["com.dts.freefireth","com.dts.freefiremax","com.roblox.client","com.activision.callofduty.shooter","com.tencent.ig","com.mojang.minecraftpe","com.mobile.legends","com.supercell.brawlstars","com.kitkagames.fallbuddies"]) assert.ok(html.includes('value="'+pkg+'"'), "Jogo ausente: "+pkg);
  assert.match(html, /id="optimizerGameTarget"/);
  assert.ok(js.includes("function currentGameTarget()"));
  assert.ok(js.includes("massinhaPkg||pkg"));
  assert.ok(js.includes('target.family!=="freefire"'));
  assert.ok(js.includes("GAME_TARGET_KEY"));
  assert.ok(js.includes('if(pkg==="com.dts.freefireth"||pkg==="com.dts.freefiremax")openFreeFire'));
});


test("lista nativa de pacotes permitidos inclui os jogos universais e mantém Massinha separado", () => {
  for (const pkg of ["com.roblox.client","com.activision.callofduty.shooter","com.tencent.ig","com.mojang.minecraftpe","com.mobile.legends","com.supercell.brawlstars","com.kitkagames.fallbuddies"]) assert.ok(android.includes(pkg), "Pacote nativo ausente: "+pkg);
  assert.ok(safeService.includes("allowedMassinha=setOf(\"com.dts.freefireth\",\"com.dts.freefiremax\")"));
  assert.ok(safeService.includes("require(pkg in allowedMassinha)"));
});


test("outros jogos podem ser selecionados por pacote validado e Massinha continua exclusivo", () => {
  assert.ok(html.includes('value="custom"'));
  assert.ok(html.includes('id="optimizerCustomPackage"'));
  assert.ok(js.includes("optimizerCustomPackage"));
  assert.ok(js.includes("Informe um identificador de pacote válido"));
  assert.ok(main.includes("isSupportedGamePackage(packageName)"));
  assert.ok(service.includes("isAllowedGamePackage(pkg)"));
  assert.ok(service.includes("require(pkg in allowedMassinha)"));
});
