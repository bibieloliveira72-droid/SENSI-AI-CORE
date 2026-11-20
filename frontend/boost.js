(() => {
"use strict";
const $=id=>document.getElementById(id), bridge=window.AndroidBridge||null;
const parse=v=>{try{return JSON.parse(v)}catch(_){return null}};
const put=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const guides={
game:["Preparar jogo","Escolha gráficos que o aparelho mantenha estáveis, teste uma partida curta e desligue apenas sobreposições que você não usa."],
memory:["Revisar memória","Atualize o diagnóstico. Feche manualmente apenas apps que você abriu e não está usando. Mantenha música e comunicação se precisar delas."],
thermal:["Controle térmico","Observe temperatura e alertas. Se aquecer, pause e deixe esfriar naturalmente. Evite jogar carregando ou sob sol direto."],
battery:["Cuidar da bateria","Use brilho confortável, confira consumo por app e escolha economia de bateria apenas quando aceitar possíveis limites de desempenho."],
network:["Rede e conexão","Prefira conexão estável, pause downloads iniciados por você e evite alternar de rede durante a partida."],
touch:["Controles e toque","Ajuste HUD dentro do jogo, teste uma mudança por vez e mantenha acessibilidade e opções de toque nos padrões se não souber a função."],
display:["Tela e fluidez","Use apenas taxas de atualização oferecidas pelo fabricante. Se houver aquecimento ou instabilidade, volte para uma opção mais equilibrada."],
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
function buildPlan(){const keys=selected(),box=$("boostPlanResult");if(!box)return;box.replaceChildren();if(!keys.length){const p=document.createElement("p");p.textContent="Escolha pelo menos uma opção para montar seu plano.";box.append(p);return}
const h=document.createElement("strong");h.textContent="Seu plano de otimização • "+keys.length+" etapa(s)";box.append(h);
const p=document.createElement("p");p.textContent="Siga na ordem abaixo e marque mentalmente o que já conferiu. Você continua no controle de cada mudança.";box.append(p);
const ol=document.createElement("ol");keys.forEach(key=>{const li=document.createElement("li"),b=document.createElement("b"),span=document.createElement("span");b.textContent=guides[key][0]+": ";span.textContent=guides[key][1];li.append(b,span);ol.append(li)});box.append(ol);
const note=document.createElement("small");note.textContent="Plano de orientação. Nenhum comando ou ajuste foi aplicado pelo aplicativo.";box.append(note)}
let applyQueue=[],applyIndex=0;
function updateApplyButton(){const btn=$("boostApplyBtn");if(!btn)return;const count=selected().length;btn.disabled=count===0;btn.textContent=applyQueue.length&&applyIndex<applyQueue.length?"CONTINUAR APLICAÇÃO ("+(applyIndex+1)+"/"+applyQueue.length+")":"APLICAR MODIFICAÇÕES"}
function applyNext(){
 const keys=selected(),status=$("boostApplyStatus");
 if(!keys.length){if(status)status.textContent="Selecione ao menos uma opção antes de aplicar.";return}
 if(!applyQueue.length||applyIndex>=applyQueue.length){applyQueue=keys;applyIndex=0}
 const key=applyQueue[applyIndex];
 if(key==="refresh"){refresh();applyIndex++;if(status)status.textContent="Diagnóstico atualizado. "+(applyIndex<applyQueue.length?"Volte e toque em continuar para a próxima etapa.":"Todas as etapas selecionadas foram processadas.");updateApplyButton();return}
 if(!bridge||typeof bridge.openBoostSettings!=="function"){if(status)status.textContent="Esta ação exige a versão APK Android. Nenhuma alteração foi feita.";return}
 const result=parse(bridge.openBoostSettings(key));
 if(!result||!result.ok){if(status)status.textContent=(result&&result.message)||"Não foi possível abrir a tela correspondente do Android.";return}
 applyIndex++;
 if(status)status.textContent=result.message+" "+(applyIndex<applyQueue.length?"Conclua a etapa no Android e volte para continuar.":"Fim da lista. Revise as alterações feitas nas telas do Android.");
 updateApplyButton();
}
function thermal(n){return ({0:"Normal",1:"Leve",2:"Moderado",3:"Alto",4:"Severo",5:"Crítico",6:"Emergência"})[n]||"Não informado"}
function refresh(){let d=null;if(bridge&&typeof bridge.getDeviceSnapshot==="function")d=parse(bridge.getDeviceSnapshot());
if(!d){put("boostDevice","Modo navegador: diagnóstico Android nativo indisponível.");put("boostMemory","N/D");put("boostMemoryHint","Disponível no APK");put("boostBattery","N/D");put("boostBatteryHint","Disponível no APK");put("boostTemp","N/D");put("boostTempHint","Disponível no APK");put("boostAndroid",/Android/i.test(navigator.userAgent)?"Android":"Web");put("boostAndroidHint","Sem leitura nativa");put("boostAdvice","Abra a versão APK para consultar os dados do Android.");return}
put("boostDevice",(d.manufacturer+" "+d.model).trim());put("boostMemory",d.availableMemoryMb>=0?Math.round(d.availableMemoryMb)+" MB":"N/D");put("boostMemoryHint",d.totalMemoryMb>0?"de "+Math.round(d.totalMemoryMb)+" MB totais":"Leitura indisponível");put("boostBattery",d.batteryPercent>=0?d.batteryPercent+"%":"N/D");put("boostBatteryHint","Nível informado pelo Android");put("boostTemp",d.batteryTempC>=0?Number(d.batteryTempC).toFixed(1)+" °C":"N/D");put("boostTempHint",thermal(d.thermalStatus));put("boostAndroid",d.android||"N/D");put("boostAndroidHint","API "+(d.sdk||"N/D"));
const tips=[];if(d.batteryTempC>=45)tips.push("Temperatura da bateria elevada. Faça uma pausa e deixe esfriar naturalmente.");else if(d.batteryTempC>=0)tips.push("Temperatura da bateria sem alerta imediato.");if(d.availableMemoryMb>=0&&d.totalMemoryMb>0&&d.availableMemoryMb/d.totalMemoryMb<.12)tips.push("Pouca memória disponível. Feche manualmente apps que não está usando.");if(d.lowMemory)tips.push("O Android sinalizou pouca memória.");if(d.thermalStatus>=3)tips.push("Estado térmico elevado. Reduza a carga gráfica e aguarde.");if(!tips.length)tips.push("Sem alertas claros nos dados disponíveis. Isso não substitui um teste de estabilidade.");put("boostAdvice",tips.join(" "))}
function shizuku(kind,title,detail,canRequest){const box=$("shizukuStatus");if(!box)return;box.className="shizuku-status "+kind;const strong=box.querySelector("strong"),small=box.querySelector("small");if(strong)strong.textContent=title;if(small)small.textContent=detail;const grant=$("shizukuGrantBtn");if(grant)grant.disabled=!canRequest}
function check(){if(!bridge||typeof bridge.getShizukuStatus!=="function"){shizuku("","Disponível somente no APK Android","O painel web não possui conexão nativa.",false);return}const s=parse(bridge.getShizukuStatus());if(!s||!s.running)shizuku("","Shizuku não está ativo","Inicie o serviço no app Shizuku e verifique novamente.",false);else if(s.granted)shizuku("ready","Serviço ativo e autorização concedida","A autorização está disponível, mas este app ainda não executa comandos privilegiados.",false);else shizuku("denied","Autorização pendente","Você pode solicitar a permissão. A escolha continua sendo sua.",true)}
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll("#boostMultiGrid input").forEach(x=>x.addEventListener("change",()=>{applyQueue=[];applyIndex=0;syncCount();updateApplyButton()}));
$("boostSelectRecommended")?.addEventListener("click",()=>setSelected(recommended[$("boostUseCase")?.value||"stable"]||recommended.stable));
$("boostSelectAll")?.addEventListener("click",()=>setSelected(Object.keys(guides)));
$("boostClearSelection")?.addEventListener("click",()=>setSelected([]));
$("boostBuildPlan")?.addEventListener("click",buildPlan);
$("boostRefreshBtn")?.addEventListener("click",()=>{try{refresh()}catch(_){put("boostAdvice","Não foi possível ler os dados do Android. Tente novamente.")}});
$("shizukuCheckBtn")?.addEventListener("click",()=>{try{check()}catch(_){shizuku("","Falha na consulta","Verifique se o serviço está ativo.",false)}});
$("shizukuGrantBtn")?.addEventListener("click",()=>{try{if(bridge&&typeof bridge.requestShizukuPermission==="function"){bridge.requestShizukuPermission();shizuku("","Solicitação enviada","Conclua ou negue no Shizuku e depois toque em verificar.",false)}}catch(_){shizuku("","Falha ao solicitar","O app continua funcionando sem Shizuku.",false)}});
put("boostDevice","Diagnóstico pronto. Atualize quando quiser.");put("boostAdvice","Toque em Atualizar diagnóstico para consultar o Android.");shizuku("","Consulta sob demanda","Toque em verificar Shizuku quando quiser.",false);syncCount();updateApplyButton();
});
})();