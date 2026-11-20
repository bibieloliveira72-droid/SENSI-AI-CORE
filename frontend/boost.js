(() => {
"use strict";
const $=id=>document.getElementById(id), bridge=window.AndroidBridge||null;
const parse=v=>{try{return JSON.parse(v)}catch(_){return null}};
const put=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const settingTargets={battery:"battery",network:"network",display:"display",storage:"storage",background:"background",sound:"sound",privacy:"privacy",notifications:"notifications",updates:"updates",accessibility:"accessibility"};

const SETTINGS_KEY="sensi_ai_app_settings_v1";
const defaultSettings={autoOpenFreeFire:true,gameEdition:"freefire"};
function readSettings(){try{return {...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")}}catch(_){return {...defaultSettings}}}
let appSettings=readSettings();
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(appSettings))}catch(_){}}
function syncSettingsUI(){
const auto=$("settingAutoOpenFF"),edition=$("settingGameEdition");
if(auto)auto.checked=!!appSettings.autoOpenFreeFire;
if(edition)edition.value=appSettings.gameEdition;
}
function openFreeFire(manual){
if(!bridge||typeof bridge.openFreeFire!=="function"){put("settingsStatus","A abertura automática está disponível apenas no APK Android.");if(manual)applyStatus("Instale e abra o SENSI.AI pelo APK para iniciar o Free Fire.");return false}
let opened=false;try{opened=bridge.openFreeFire(appSettings.gameEdition)==="opened"}catch(_){}
const message=opened?"Free Fire iniciado. Boa partida!": "Não encontrei essa versão do Free Fire instalada. Confira a versão escolhida nas Configurações.";
put("settingsStatus",message);if(!manual)applyStatus(message);return opened
}
const guides={
game:["Preparar jogo","Escolha gráficos que o aparelho mantenha estáveis, teste uma partida curta e desligue apenas sobreposições que você não usa."],
memory:["Revisar memória","Atualize o diagnóstico. Feche manualmente apenas apps que você abriu e não está usando. Mantenha música e comunicação se precisar delas."],
thermal:["Controle térmico","Observe temperatura e alertas. Se aquecer, pause e deixe esfriar naturalmente. Evite jogar carregando ou sob sol direto."],
battery:["Cuidar da bateria","Use brilho confortável, confira consumo por app e escolha economia de bateria apenas quando aceitar possíveis limites de desempenho."],
network:["Rede e conexão","Prefira conexão estável, pause downloads iniciados por você e evite alternar de rede durante a partida."],
touch:["Controles e toque","Ajuste HUD dentro do jogo, teste uma mudança por vez e mantenha acessibilidade e opções de toque nos padrões se não souber a função."],
display:["Tela e fluidez","Use apenas taxas de atualização oferecidas pelo fabricante. Se houver aquecimento ou instabilidade, volte para uma opção mais equilibrada."],
animations:["Animações Leves","Reduz as três escalas de animação da interface Android para 0,5x. Isso pode deixar menus e transições mais rápidos visualmente, mas não aumenta o FPS do jogo."],
storage:["Armazenamento","Revise arquivos que reconhece e não precisa. Não apague pastas Android/data ou dados de jogos para liberar espaço."],
background:["Apps em segundo plano","Revise apps recentes e encerre manualmente somente os que não precisa. Não restrinja serviços importantes, música ou acessibilidade."],
sound:["Áudio","Confira volume, saída de som e Bluetooth. Evite alterações extremas de volume."],
privacy:["Privacidade","Revise permissões e acessos especiais. Mantenha as proteções e atualizações de segurança ativas."],
report:["Relatório do sistema","Confira memória disponível, bateria, temperatura e estabilidade em uma sessão curta. Compare os resultados depois."],
refresh:["Diagnóstico atualizado","Toque em Atualizar diagnóstico acima para ler os dados que o Android disponibiliza. Leituras não equivalem a benchmark."],
notifications:["Notificações","Configure Não Perturbe manualmente e permita chamadas ou alertas importantes. Reverta quando terminar de jogar."],
updates:["Atualizações","Agende downloads e atualizações para um horário conveniente. Não desative atualizações de segurança."],
accessibility:["Acessibilidade","Revise recursos ativos e mantenha ligados os que você usa. Não desative serviços essenciais para tentar ganhar desempenho."]
};
const recommended={stable:["game","memory","thermal","display","background","refresh"],cool:["thermal","display","battery","game"],battery:["battery","display","background","updates"],network:["network","updates","notifications"],balanced:["game","memory","thermal","network","display","refresh"]};
function selected(){return [...document.querySelectorAll("#boostMultiGrid input:checked")].map(x=>x.value)}
function syncCount(){put("boostSelectedCount",selected().length+" selecionada(s)")}
function setSelected(keys){document.querySelectorAll("#boostMultiGrid input").forEach(x=>x.checked=keys.includes(x.value));syncCount()}
function buildPlan(){
 const keys=selected(),box=$("boostPlanResult");
 if(!box)return;
 box.replaceChildren();
 if(!keys.length){const p=document.createElement("p");p.textContent="Escolha pelo menos uma opção para montar seu plano.";box.append(p);return}
 const h=document.createElement("strong");h.textContent="Seu plano de otimização • "+keys.length+" etapa(s)";box.append(h);
 const p=document.createElement("p");p.textContent="Confira cada etapa manualmente. O plano não executa ações escondidas.";box.append(p);
 const ol=document.createElement("ol");
 keys.forEach(key=>{const li=document.createElement("li"),b=document.createElement("b"),span=document.createElement("span");b.textContent=guides[key][0]+": ";span.textContent=guides[key][1];li.append(b,span);ol.append(li)});
 box.append(ol);
}
function startApplyTweaks(){
 const keys=selected();
 if(!keys.length){applyStatus("Selecione pelo menos um ajuste antes de continuar.");return}
 if(!keys.includes("animations")){applyStatus("Os itens selecionados são orientações manuais. Animações Leves é o único ajuste desta lista aplicado via Shizuku.");return}
 if(!bridge||typeof bridge.applySafeTweak!=="function"){applyStatus("Animações Leves exige o APK Android e autorização Shizuku.");return}
 if(!window.confirm("Aplicar Animações Leves em 0,5x? Os valores atuais serão salvos para restauração.")){applyStatus("Aplicação cancelada.");return}
 try{
  const result=parse(bridge.applySafeTweak("animations"));
  applyStatus(result?.message||(result?.ok?"Animações Leves aplicadas.":"Não foi possível aplicar. Verifique o Shizuku."));
 }catch(_){applyStatus("Falha ao aplicar Animações Leves. Verifique o Shizuku.")}
}
function thermal(n){return ({0:"Normal",1:"Leve",2:"Moderado",3:"Alto",4:"Severo",5:"Crítico",6:"Emergência"})[n]||"Não informado"}
function refresh(){let d=null;if(bridge&&typeof bridge.getDeviceSnapshot==="function")d=parse(bridge.getDeviceSnapshot());
if(!d){put("boostDevice","Modo navegador: diagnóstico Android nativo indisponível.");put("boostMemory","N/D");put("boostMemoryHint","Disponível no APK");put("boostBattery","N/D");put("boostBatteryHint","Disponível no APK");put("boostTemp","N/D");put("boostTempHint","Disponível no APK");put("boostAndroid",/Android/i.test(navigator.userAgent)?"Android":"Web");put("boostAndroidHint","Sem leitura nativa");put("boostAdvice","Abra a versão APK para consultar os dados do Android.");return}
put("boostDevice",(d.manufacturer+" "+d.model).trim());put("boostMemory",d.availableMemoryMb>=0?Math.round(d.availableMemoryMb)+" MB":"N/D");put("boostMemoryHint",d.totalMemoryMb>0?"de "+Math.round(d.totalMemoryMb)+" MB totais":"Leitura indisponível");put("boostBattery",d.batteryPercent>=0?d.batteryPercent+"%":"N/D");put("boostBatteryHint","Nível informado pelo Android");put("boostTemp",d.batteryTempC>=0?Number(d.batteryTempC).toFixed(1)+" °C":"N/D");put("boostTempHint",thermal(d.thermalStatus));put("boostAndroid",d.android||"N/D");put("boostAndroidHint","API "+(d.sdk||"N/D"));
const tips=[];if(d.batteryTempC>=45)tips.push("Temperatura da bateria elevada. Faça uma pausa e deixe esfriar naturalmente.");else if(d.batteryTempC>=0)tips.push("Temperatura da bateria sem alerta imediato.");if(d.availableMemoryMb>=0&&d.totalMemoryMb>0&&d.availableMemoryMb/d.totalMemoryMb<.12)tips.push("Pouca memória disponível. Feche manualmente apps que não está usando.");if(d.lowMemory)tips.push("O Android sinalizou pouca memória.");if(d.thermalStatus>=3)tips.push("Estado térmico elevado. Reduza a carga gráfica e aguarde.");if(!tips.length)tips.push("Sem alertas claros nos dados disponíveis. Isso não substitui um teste de estabilidade.");put("boostAdvice",tips.join(" "))}
function shizuku(kind,title,detail,canRequest){const box=$("shizukuStatus");if(!box)return;box.className="shizuku-status "+kind;const strong=box.querySelector("strong"),small=box.querySelector("small");if(strong)strong.textContent=title;if(small)small.textContent=detail;const grant=$("shizukuGrantBtn");if(grant)grant.disabled=!canRequest}
function check(){if(!bridge||typeof bridge.getShizukuStatus!=="function"){shizuku("","Disponível somente no APK Android","O painel web não possui conexão nativa.",false);return}const s=parse(bridge.getShizukuStatus());if(!s||!s.running)shizuku("","Shizuku não está ativo","Inicie o serviço no app Shizuku e verifique novamente.",false);else if(s.granted)shizuku("ready","Shizuku ativo e SENSI.AI autorizado","Autorização confirmada. Os tweaks via Shizuku estão liberados para execução.",false);else shizuku("denied","Autorização pendente","Você pode solicitar a permissão. A escolha continua sendo sua.",true)}
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll("#boostMultiGrid input").forEach(x=>x.addEventListener("change",syncCount));
const massinhaPackage=$("massinhaTargetPackage");
function massinhaCommands(){
 const pkg=massinhaPackage?.value||"com.dts.freefireth";
 const v1="settings put global angle_gl_driver_selection_pkgs "+pkg+" && settings put global angle_gl_driver_selection_values angle && setprop debug.angle.feature_overrides_enabled disableAnisotropicFiltering:forceTextureLodOffset4 && am force-stop "+pkg;
 const v2="settings put global angle_gl_driver_selection_pkgs "+pkg+" && settings put global angle_gl_driver_selection_values angle && setprop debug.angle.feature_overrides_enabled forceNearestFiltering:disableAnisotropicFiltering:forceTextureLodOffset4 && am force-stop "+pkg;
 put("massinhaCommandV1",v1);put("massinhaCommandV2",v2);
 return {v1,v2};
}
async function copyMassinha(version){
 const commands=massinhaCommands(),value=version==="v2"?commands.v2:commands.v1;
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(value);
  else {const field=document.createElement("textarea");field.value=value;field.setAttribute("readonly","");field.style.position="fixed";field.style.opacity="0";document.body.append(field);field.select();const ok=document.execCommand("copy");field.remove();if(!ok)throw new Error("Cópia indisponível neste aparelho.");}
  put("massinhaCopyStatus","Comando "+version.toUpperCase()+" copiado. Cole no terminal do Brevent.");
 }catch(_){put("massinhaCopyStatus","Não foi possível copiar automaticamente. Selecione e copie o comando exibido.");}
}
$("boostSelectRecommended")?.addEventListener("click",()=>setSelected(recommended[$("boostUseCase")?.value||"stable"]||recommended.stable));
$("boostSelectAll")?.addEventListener("click",()=>setSelected(Object.keys(guides)));
$("boostClearSelection")?.addEventListener("click",()=>setSelected([]));
$("massinhaTargetPackage")?.addEventListener("change",massinhaCommands);
$("massinhaCopyV1")?.addEventListener("click",()=>copyMassinha("v1"));
$("massinhaCopyV2")?.addEventListener("click",()=>copyMassinha("v2"));
massinhaCommands();
$("boostBuildPlan")?.addEventListener("click",buildPlan);
$("boostApplyTweaks")?.addEventListener("click",startApplyTweaks);

$("boostRestoreTweaks")?.addEventListener("click",()=>{
 if(!bridge||typeof bridge.restoreSafeTweak!=="function"){applyStatus("A restauração exige o APK Android com Shizuku.");return}
 try{const messages=[];const a=parse(bridge.restoreSafeTweak("animations"));if(a?.ok)messages.push(a.message);if(typeof bridge.restoreMassinhaTweak==="function"){const m=parse(bridge.restoreMassinhaTweak());if(m?.ok)messages.push(m.message);}applyStatus(messages.length?messages.join(" "):(a?.message||"Nenhum backup disponível."));}
 catch(_){applyStatus("Falha ao restaurar. Verifique Shizuku.")}
});
$("boostRefreshBtn")?.addEventListener("click",()=>{try{refresh()}catch(_){put("boostAdvice","Não foi possível ler os dados do Android. Tente novamente.")}});
$("shizukuCheckBtn")?.addEventListener("click",()=>{try{check()}catch(_){shizuku("","Falha na consulta","Verifique se o serviço está ativo.",false)}});
$("shizukuGrantBtn")?.addEventListener("click",()=>{try{if(bridge&&typeof bridge.requestShizukuPermission==="function"){const message=bridge.requestShizukuPermission();shizuku("","Solicitação de autorização",message||"Confira a confirmação no Shizuku e depois toque em verificar.",false)}}catch(error){shizuku("","Falha ao solicitar",String(error?.message||"Não foi possível abrir o pedido de autorização."),false)}});
$("settingAutoOpenFF")?.addEventListener("change",e=>{appSettings.autoOpenFreeFire=e.target.checked;saveSettings();put("settingsStatus",e.target.checked?"O Free Fire será aberto ao concluir os tweaks.":"A abertura automática foi desativada.")});
$("settingGameEdition")?.addEventListener("change",e=>{appSettings.gameEdition=e.target.value;saveSettings();put("settingsStatus","Versão preferida salva neste aparelho.")});
$("settingsOpenFF")?.addEventListener("click",()=>openFreeFire(true));
$("settingsReset")?.addEventListener("click",()=>{appSettings={...defaultSettings};saveSettings();syncSettingsUI();put("settingsStatus","Preferências restauradas para os padrões.")});
syncSettingsUI();
put("boostDevice","Diagnóstico pronto. Atualize quando quiser.");put("boostAdvice","Toque em Atualizar diagnóstico para consultar o Android.");shizuku("","Consulta sob demanda","Toque em verificar Shizuku quando quiser.",false);syncCount();
});
})();