(() => {
"use strict";
const $=id=>document.getElementById(id), bridge=window.AndroidBridge||null;
const parse=v=>{try{return JSON.parse(v)}catch(_){return null}};
const put=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const settingTargets={battery:"battery",network:"network",display:"display",storage:"storage",background:"background",memory:"memory",touch:"touch",sound:"sound",privacy:"privacy",notifications:"notifications",updates:"updates",accessibility:"accessibility"};

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
function openFreeFire(manual,editionOverride){
if(!bridge||typeof bridge.openFreeFire!=="function"){put("settingsStatus","A abertura automática está disponível apenas no APK Android.");if(manual)applyStatus("Instale e abra o SENSI.AI pelo APK para iniciar o Free Fire.");return false}
let opened=false;try{opened=bridge.openFreeFire(editionOverride||appSettings.gameEdition)==="opened"}catch(_){}
const message=opened?"Free Fire iniciado. Boa partida!": "Não encontrei essa versão do Free Fire instalada. Confira a versão escolhida nas Configurações.";
put("settingsStatus",message);if(!manual)applyStatus(message);return opened
}
const guides={
game:["Compilar perfil do jogo","Compila o jogo com o modo ART speed -f do Benimaru."],
shader:["Driver gráfico Benimaru","Seleciona ANGLE, nativo ou padrão para o Free Fire com backup restaurável."],
refreshRate:["Taxa de atualização","Aplica um limite de Hz escolhido e guarda os valores anteriores."],
gameMode:["Modo de desempenho do jogo","Ativa o modo performance nativo do Android para o Free Fire. Pode não existir em todos os aparelhos; restauração para modo padrão."],
massinha:["Gráficos Massinha","Perfil ANGLE V1 ou V2 para Free Fire. O jogo selecionado será encerrado para recarregar; faça backup e use apenas se aceitar essa alteração."],
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
const guideActionLabels={
game:"COMPILAR PERFIL",gameMode:"ATIVAR MODO PERFORMANCE",shader:"APLICAR DRIVER GRÁFICO",refreshRate:"APLICAR TAXA DE HZ",massinha:"APLICAR COM SHIZUKU",memory:"DIAGNÓSTICO + APPS",thermal:"ATUALIZAR TEMPERATURA",battery:"ABRIR BATERIA",network:"ABRIR WI-FI",touch:"ABRIR TELA / TOQUE",display:"ABRIR TELA",animations:"APLICAR 0,5x",storage:"ABRIR ARMAZENAMENTO",background:"ABRIR APPS",sound:"ABRIR ÁUDIO",privacy:"ABRIR PRIVACIDADE",report:"COPIAR RELATÓRIO",refresh:"ATUALIZAR DIAGNÓSTICO",notifications:"ABRIR NOTIFICAÇÕES",updates:"ABRIR CONFIGURAÇÕES",accessibility:"ABRIR ACESSIBILIDADE"
};
const recommended={stable:["animations","game","gameMode"],cool:["animations","game"],battery:["animations"],network:["animations"],balanced:["animations","game","gameMode"]};
let activeBoostProfile="stable";
function selected(){return [...document.querySelectorAll("#tab-boost input[type=checkbox]:checked")].map(x=>x.value)}
function syncCount(){put("boostSelectedCount",selected().length+" selecionada(s)")}
function setSelected(keys){document.querySelectorAll("#tab-boost input[type=checkbox]").forEach(x=>x.checked=keys.includes(x.value));syncCount()}
function openNativeSettings(key){
 const target=settingTargets[key]||key;
 if(!bridge||typeof bridge.openTweakSettings!=="function"){applyStatus("Este atalho exige o APK Android. No painel web, consulte a orientação da etapa.");return false}
 let opened=false;try{opened=bridge.openTweakSettings(target)===true}catch(_){}
 const messages={battery:"Painel de bateria aberto. Confira o consumo e escolha economia somente se aceitar os limites.",network:"Configurações de Wi-Fi abertas. Verifique a rede estável que você usa para jogar.",display:"Configurações de tela abertas. Use apenas opções oferecidas pelo aparelho.",touch:"Configurações de tela abertas. Em aparelhos Samsung, procure Sensibilidade ao toque, se disponível.",storage:"Armazenamento aberto. Não apague dados ou pastas de jogos para liberar espaço.",background:"Lista de aplicativos aberta. Revise manualmente e não encerre Spotify, Shizuku ou serviços importantes.",memory:"Diagnóstico atualizado e lista de aplicativos aberta. Feche somente apps que você reconhece e não precisa.",sound:"Configurações de áudio abertas.",privacy:"Configurações de privacidade abertas. Mantenha proteções e permissões necessárias.",notifications:"Configurações de notificações abertas. Preserve chamadas e alertas importantes.",updates:"Configurações do Android abertas. Procure Atualização de software quando quiser verificar atualizações.",accessibility:"Configurações de acessibilidade abertas. Não desative recursos que você utiliza."};
 applyStatus(opened?(messages[key]||"Painel do Android aberto."):"O Android ou a versão do fabricante não disponibilizou esse painel. Nenhuma configuração foi alterada.");
 return opened;
}
async function copySystemReport(){
 const d=lastDeviceSnapshot;
 if(!d){put("boostApplyStatus","Relatório indisponível. Atualize primeiro o diagnóstico do aparelho.");return false}
 const report=["SENSI.AI BOOST REPORT","Dispositivo: "+d.manufacturer+" "+d.model,"Android: "+d.android+" (API "+d.sdk+")","RAM disponível: "+d.availableMemoryMb+" MB / "+d.totalMemoryMb+" MB","Bateria: "+d.batteryPercent+"%","Temperatura da bateria: "+d.batteryTempC+" °C","Estado térmico: "+thermal(d.thermalStatus),"Resolução: "+(d.screenWidth>0?d.screenWidth+" x "+d.screenHeight:"N/D"),"Taxa de atualização: "+(d.refreshRateHz>0?d.refreshRateHz+" Hz":"N/D"),"Densidade: "+(d.densityDpi>0?d.densityDpi+" DPI":"N/D"),"Gerado em: "+new Date().toLocaleString()].join("\n");
 try{if(bridge?.copyText)bridge.copyText(report);else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(report);else throw new Error("Cópia indisponível");put("boostApplyStatus","Relatório do aparelho copiado.");return true}catch(_){put("boostApplyStatus","Não foi possível copiar o relatório neste ambiente.");return false}
}
function runGuideAction(key){
 if(key==="game"||key==="gameMode"||key==="shader"){startApplyTweaks();return;}
 if(key==="thermal"||key==="refresh"){try{refresh();applyStatus(key==="thermal"?"Leitura térmica atualizada. Consulte o Heat Shield e faça uma pausa se houver alerta.":"Diagnóstico do Android atualizado.");}catch(_){applyStatus("Não foi possível atualizar o diagnóstico. Tente novamente.");}return}
 if(key==="report"){copySystemReport();return}
 if(key==="memory"){try{refresh()}catch(_){}openNativeSettings("memory");return}
 if(key==="animations"||key==="massinha"){startApplyTweaks();return}
 if(settingTargets[key]){openNativeSettings(key);return}
 applyStatus("Esta etapa ainda não possui uma ação compatível com o Android instalado.");
}
function buildPlan(){
 const keys=selected(),box=$("boostPlanResult");if(!box)return;box.replaceChildren();
 if(!keys.length){const p=document.createElement("p");p.textContent="Escolha pelo menos uma opção para montar seu plano.";box.append(p);return}
 const executable=keys.filter(k=>["animations","massinha","game","gameMode","shader","refreshRate"].includes(k)),manual=keys.filter(k=>!executable.includes(k));
 const h=document.createElement("strong");h.textContent="Plano SENSI.AI · "+keys.length+" etapa(s)";box.append(h);
 const p=document.createElement("p");p.textContent=executable.length?executable.length+" ajuste(s) protegido(s) usam Shizuku, confirmação e backup. "+manual.length+" atalho(s) abrem painéis oficiais, atualizam diagnósticos ou copiam o relatório.":"Todas as etapas selecionadas agora possuem uma ação: abrir um painel do Android, atualizar uma leitura, iniciar o jogo ou copiar o relatório.";box.append(p);
 const group=(title,items)=>{if(!items.length)return;const heading=document.createElement("h4");heading.textContent=title;box.append(heading);const ol=document.createElement("ol");items.forEach(k=>{const li=document.createElement("li"),strong=document.createElement("b"),span=document.createElement("span"),button=document.createElement("button");strong.textContent=guides[k][0]+": ";span.textContent=guides[k][1];button.type="button";button.className="btn-ghost-sm boost-plan-action";button.textContent=guideActionLabels[k]||"EXECUTAR ETAPA";button.addEventListener("click",()=>runGuideAction(k));li.append(strong,span,button);ol.append(li)});box.append(ol)};
 group("AJUSTES PROTEGIDOS VIA SHIZUKU",executable);group("ATALHOS E AÇÕES DO ANDROID",manual);
 const note=document.createElement("small");note.textContent="Os atalhos não encerram aplicativos nem alteram opções silenciosamente. Spotify, Shizuku e serviços importantes são preservados.";box.append(note);
}
let nativeRequestCounter=0;
const nativeWaiters=new Map();
window.__sensiNativeResult=(id,raw)=>{
 const pending=nativeWaiters.get(String(id));if(!pending)return;
 clearTimeout(pending.timer);nativeWaiters.delete(String(id));
 pending.resolve(parse(raw)||{ok:false,message:"Resposta nativa inválida."});
};
function runNativeTweak(operation,payload){
 return new Promise(resolve=>{
  if(!bridge||typeof bridge.runTweakAsync!=="function"){resolve({ok:false,message:"Executor assíncrono indisponível. Atualize o APK."});return;}
  const id=String(++nativeRequestCounter);
  const timer=setTimeout(()=>{nativeWaiters.delete(id);resolve({ok:false,message:"Tempo esgotado aguardando o serviço Shizuku. Nenhuma confirmação de sucesso foi recebida."});},45000);
  nativeWaiters.set(id,{resolve,timer});
  try{bridge.runTweakAsync(operation,JSON.stringify(payload||{}),id);}
  catch(error){clearTimeout(timer);nativeWaiters.delete(id);resolve({ok:false,message:String(error?.message||"Falha ao iniciar a operação nativa.")});}
 });
}
function breventScript(payload){
 const {doMassinha,pkg,version}=payload;
 if(!doMassinha||!["com.dts.freefireth","com.dts.freefiremax"].includes(pkg))return "";
 const feature=version==="v2"?"forceNearestFiltering:disableAnisotropicFiltering:forceTextureLodOffset4":"disableAnisotropicFiltering:forceTextureLodOffset4";
 const lines=["# SENSI.AI / Graficos Massinha "+(version==="v2"?"V2":"V1"),"PKG="+pkg,
  "OLD_PKGS=$(settings get global angle_gl_driver_selection_pkgs)",
  "OLD_VALUES=$(settings get global angle_gl_driver_selection_values)",
  "case \",$OLD_PKGS,\" in *\",$PKG,\"*) echo Ja existe uma entrada ANGLE para este jogo. Nenhuma alteracao foi feita. ;; *) if [ \"$OLD_PKGS\" = null ] || [ -z \"$OLD_PKGS\" ]; then settings put global angle_gl_driver_selection_pkgs \"$PKG\" && settings put global angle_gl_driver_selection_values angle; else settings put global angle_gl_driver_selection_pkgs \"$OLD_PKGS,$PKG\" && settings put global angle_gl_driver_selection_values \"$OLD_VALUES,angle\"; fi ;; esac",
  "setprop debug.angle.feature_overrides_enabled "+feature,
  "# Execute no Brevent. Depois, abra o Free Fire manualmente para testar."];
 return lines.join("\n");
}
async function copyBreventCommand(){
 const value=$("breventCommandOutput")?.value||"";
 if(!value){put("breventCommandStatus","Gere o comando selecionando os módulos e tocando em Aplicar.");return;}
 try{
  if(bridge?.copyText)bridge.copyText(value);
  else if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(value);
  else {const field=$("breventCommandOutput");field.focus();field.select();if(!document.execCommand("copy"))throw new Error("Cópia indisponível");}
  put("breventCommandStatus","Comando copiado. Abra o Brevent, entre em Executar comando, cole e confirme.");
 }catch(_){put("breventCommandStatus","Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");}
}
function startApplyTweaks(){
 const keys=selected(),doAnimations=keys.includes("animations"),doMassinha=keys.includes("massinha"),doGame=keys.includes("game"),doGameMode=keys.includes("gameMode"),doShader=keys.includes("shader"),doRefreshRate=keys.includes("refreshRate");
 if(!keys.length){applyStatus("Selecione pelo menos um ajuste antes de continuar.");return}
 buildPlan();
 if(!doAnimations&&!doMassinha&&!doGame&&!doGameMode&&!doShader&&!doRefreshRate){applyStatus("Nenhuma otimização executável foi selecionada.");return}
 const target=currentGameTarget();
 const pkg=target.package,massinhaPkg=$("massinhaTargetPackage")?.value||"com.dts.freefireth",version=$("massinhaVersion")?.value||"v1";
 if(!pkg||!/^[A-Za-z][A-Za-z0-9_]*(\.[A-Za-z][A-Za-z0-9_]*)+$/.test(pkg)){applyStatus("Informe um identificador de pacote válido para o jogo selecionado.");return;}
 if(doMassinha&&target.family!=="freefire"){applyStatus("Gráfico Massinha está disponível somente para Free Fire e Free Fire MAX.");return;}
 const massinhaExecutionMode=$("massinhaExecutionMode")?.value||"shizuku";
 const needsShizuku=doAnimations||doGame||doGameMode||doShader||doRefreshRate||(doMassinha&&massinhaExecutionMode==="shizuku");
 if(needsShizuku){
  if(!bridge||typeof bridge.getShizukuStatus!=="function"){applyStatus("Os módulos selecionados exigem o APK Android com Shizuku.");return}
  const auth=parse(bridge.getShizukuStatus());
  if(!auth?.running||!auth?.granted){applyStatus(!auth?.running?"Shizuku não está ativo. Inicie o serviço e verifique novamente.":"Shizuku está ativo, mas o SENSI.AI ainda não recebeu autorização.");return}
 }
 const warning=[doAnimations?"Aplicar Animações Leves em 0,5x.":"",doMassinha?"Aplicar Gráficos Massinha "+version.toUpperCase()+" por "+(massinhaExecutionMode==="brevent"?"comando Brevent":"Shizuku")+".":"",doGame?"Executar compilação ART speed -f.":"",doGameMode?"Ativar modo performance do Android.":"",doShader?"Configurar o driver gráfico escolhido.":"",doRefreshRate?"Definir a taxa de atualização em "+($("benimaruRefreshRate")?.value||"60")+" Hz.":"",massinhaExecutionMode==="brevent"&&doMassinha?"Somente o Gráfico Massinha será enviado ao Brevent. Os demais módulos continuam no Shizuku.":"As operações nativas serão executadas pelo Shizuku. Confirmar?"].filter(Boolean).join("\n\n");
 const confirmBox=$("boostConfirmModal"),confirmText=$("boostConfirmMessage");
 if(!confirmBox||!confirmText){applyStatus("Confirmação visual indisponível. Nenhuma alteração foi aplicada.");return}
 confirmText.textContent=warning;
 confirmBox.classList.remove("hidden");confirmBox.setAttribute("aria-hidden","false");
 confirmBox.dataset.pending=JSON.stringify({keys,doAnimations,doMassinha,doGame,doGameMode,doShader,doRefreshRate,pkg,massinhaPkg,gameName:target.name,version,driver:$("benimaruShaderDriver")?.value||"angle",hz:Number($("benimaruRefreshRate")?.value||60),massinhaExecutionMode});
}
async function executeConfirmedTweaks(payload){
 const {keys,doAnimations,doMassinha,doGame,doGameMode,doShader,doRefreshRate,pkg,massinhaPkg,gameName="jogo selecionado",version,driver,hz,massinhaExecutionMode="shizuku"}=payload;
 const operations=[];
 if(doAnimations)operations.push(["animations",{},"Animações 0,5x"]);
 if(doRefreshRate)operations.push(["refreshRate",{hz:Number(hz||60)},"Taxa de atualização"]);
 if(doShader)operations.push(["shader",{package:pkg,driver:driver||"angle"},"Driver gráfico"]);
 if(doMassinha&&massinhaExecutionMode!=="brevent")operations.push(["massinha",{package:massinhaPkg||pkg,version},"Gráficos Massinha"]);
 if(doGameMode)operations.push(["gameMode",{package:pkg},"Modo performance"]);
 if(doGame)operations.push(["game",{package:pkg},"Compilação ART"]);
 const manual=keys.filter(k=>!["animations","massinha","game","gameMode","shader","refreshRate"].includes(k));
 const messages=[];let appliedCount=0,allApplied=true;
 for(let i=0;i<operations.length;i++){
  const [operation,args,label]=operations[i];
  put("boostApplyStatus","Executando "+label+" ("+(i+1)+"/"+operations.length+") pelo Shizuku…");
  const result=await runNativeTweak(operation,args);
  if(result?.ok){appliedCount++;messages.push(label+": "+(result.message||"concluído."));}
  else{allApplied=false;messages.push(label+": "+(result?.message||"operação recusada."));}
 }
 if(manual.length){allApplied=false;messages.push(manual.length+" opção(ões) não possuem módulo executável.");}
 if(doMassinha&&massinhaExecutionMode==="brevent"){
  const script=breventScript({...payload,pkg:massinhaPkg||pkg});
  if(script){const output=$("breventCommandOutput"),panel=$("breventCommandPanel");if(output)output.value=script;panel?.classList.remove("hidden");put("boostApplyStatus","Comando exclusivo do Gráfico Massinha "+version.toUpperCase()+" preparado. Copie e execute no Brevent.");await copyBreventCommand();}
  else{allApplied=false;messages.push("Não foi possível gerar o comando Massinha.");}
 }
 if(appliedCount>0){
  put("boostApplyStatus",messages.join(" ") +(allApplied?" Todas as operações concluídas.":" Algumas operações falharam ou foram ignoradas.")+" Alvo: "+gameName+".");
  if(pkg==="com.dts.freefireth"||pkg==="com.dts.freefiremax")openFreeFire(false,pkg==="com.dts.freefiremax"?"freefiremax":"freefire");
 }else if(!(doMassinha&&massinhaExecutionMode==="brevent")) applyStatus(messages.join(" ")+" Nenhuma otimização foi confirmada; o jogo não será aberto.");
}
function closeBoostConfirm(){const box=$("boostConfirmModal");if(box){box.classList.add("hidden");box.setAttribute("aria-hidden","true");box.dataset.pending="";}}
function thermal(n){return ({0:"Normal",1:"Leve",2:"Moderado",3:"Alto",4:"Severo",5:"Crítico",6:"Emergência"})[n]||"Não informado"}

let lastDeviceSnapshot=null;
function updateHeatShield(d){
 const state=$("heatShieldState"),meter=$("heatShieldMeter");
 if(!state||!meter)return;
 if(!d){
  state.className="heat-shield-state level-unknown";
  put("heatShieldStatus","SEM LEITURA");
  put("heatShieldThermal","Abra o APK e atualize o diagnóstico");
  put("heatShieldTemp","N/D");
  put("heatShieldAndroidStatus","N/D");
  put("heatShieldMemory","N/D");
  put("heatShieldAdvice","A leitura térmica nativa não está disponível neste modo. Nenhuma configuração foi alterada.");
  meter.style.width="0%";
  meter.parentElement?.setAttribute("aria-valuenow","0");
  return;
 }
 const temp=Number(d.batteryTempC),thermalStatus=Number(d.thermalStatus),memory=Number(d.availableMemoryMb);
 const hasTemp=Number.isFinite(temp)&&temp>=0,hasThermal=Number.isFinite(thermalStatus)&&thermalStatus>=0;
 const tempScore=hasTemp?Math.max(0,Math.min(100,((temp-30)/18)*100)):0;
 const thermalScore=hasThermal?(thermalStatus/6)*100:0;
 const score=Math.round(Math.max(tempScore,thermalScore));
 let level="normal",label="NORMAL",advice="Sem alerta térmico relevante nos dados atuais. Faça uma partida curta e compare a estabilidade antes de mudar outras configurações.";
 if(!hasTemp&&!hasThermal){level="unknown";label="SEM LEITURA";advice="O Android não disponibilizou dados térmicos nesta consulta. Tente atualizar novamente.";}
 else if((hasThermal&&thermalStatus>=4)||(hasTemp&&temp>=45)){level="high";label="ALTO";advice="O aparelho pode estar sob carga térmica elevada. Faça uma pausa e deixe esfriar naturalmente. Evite insistir em FPS ou Hz máximos.";}
 else if((hasThermal&&thermalStatus>=3)||(hasTemp&&temp>=42)){level="attention";label="ATENÇÃO";advice="Acompanhe a temperatura. Se houver quedas de quadros, reduza um nível os gráficos ou o FPS dentro do jogo e confira novamente.";}
 else if((hasThermal&&thermalStatus>=2)||(hasTemp&&temp>=40)){level="observe";label="OBSERVAR";advice="Há um sinal leve de aquecimento. Mantenha uma configuração estável e observe a tendência durante a partida.";}
 state.className="heat-shield-state level-"+level;
 put("heatShieldStatus",label);
 put("heatShieldThermal",hasThermal?"Android: "+thermal(thermalStatus):"Estado térmico Android indisponível");
 put("heatShieldTemp",hasTemp?temp.toFixed(1)+" °C":"N/D");
 put("heatShieldAndroidStatus",hasThermal?thermal(thermalStatus):"N/D");
 put("heatShieldMemory",Number.isFinite(memory)&&memory>=0?Math.round(memory)+" MB":"N/D");
 meter.style.width=score+"%";
 meter.parentElement?.setAttribute("aria-valuenow",String(score));
 put("heatShieldAdvice",advice);
}

function refresh(){let d=null;if(bridge&&typeof bridge.getDeviceSnapshot==="function")d=parse(bridge.getDeviceSnapshot());
if(!d){lastDeviceSnapshot=null;updateHeatShield(null);put("boostDevice","Modo navegador: diagnóstico Android nativo indisponível.");put("boostMemory","N/D");put("boostMemoryHint","Disponível no APK");put("boostBattery","N/D");put("boostBatteryHint","Disponível no APK");put("boostTemp","N/D");put("boostTempHint","Disponível no APK");put("boostAndroid",/Android/i.test(navigator.userAgent)?"Android":"Web");put("boostAndroidHint","Sem leitura nativa");put("boostResolution","N/D");put("boostResolutionHint","Disponível no APK");put("boostRefreshRate","N/D");put("boostRefreshRateHint","Disponível no APK");put("boostAdvice","Abra a versão APK para consultar os dados do Android.");return}
lastDeviceSnapshot=d;updateHeatShield(d);put("boostLastCheck","Última leitura: "+new Date().toLocaleTimeString());try{localStorage.setItem("sensi_boost_last_check",String(Date.now()))}catch(_){}put("boostDevice",(d.manufacturer+" "+d.model).trim());put("boostMemory",d.availableMemoryMb>=0?Math.round(d.availableMemoryMb)+" MB":"N/D");put("boostMemoryHint",d.totalMemoryMb>0?"de "+Math.round(d.totalMemoryMb)+" MB totais":"Leitura indisponível");put("boostBattery",d.batteryPercent>=0?d.batteryPercent+"%":"N/D");put("boostBatteryHint","Nível informado pelo Android");put("boostTemp",d.batteryTempC>=0?Number(d.batteryTempC).toFixed(1)+" °C":"N/D");put("boostTempHint",thermal(d.thermalStatus));put("boostAndroid",d.android||"N/D");put("boostAndroidHint","API "+(d.sdk||"N/D"));put("boostResolution",d.screenWidth>0&&d.screenHeight>0?d.screenWidth+" × "+d.screenHeight:"N/D");put("boostResolutionHint",d.densityDpi>0?d.densityDpi+" DPI":"Densidade indisponível");put("boostRefreshRate",d.refreshRateHz>0?Number(d.refreshRateHz).toFixed(1)+" Hz":"N/D");put("boostRefreshRateHint","Taxa informada pelo display");
const tips=[];if(d.batteryTempC>=45)tips.push("Temperatura da bateria elevada. Faça uma pausa e deixe esfriar naturalmente.");else if(d.batteryTempC>=0)tips.push("Temperatura da bateria sem alerta imediato.");if(d.availableMemoryMb>=0&&d.totalMemoryMb>0&&d.availableMemoryMb/d.totalMemoryMb<.12)tips.push("Pouca memória disponível. Feche manualmente apps que não está usando.");if(d.lowMemory)tips.push("O Android sinalizou pouca memória.");if(d.thermalStatus>=3)tips.push("Estado térmico elevado. Reduza a carga gráfica e aguarde.");if(!tips.length)tips.push("Sem alertas claros nos dados disponíveis. Isso não substitui um teste de estabilidade.");put("boostAdvice",tips.join(" "))}
function shizuku(kind,title,detail,canRequest){const box=$("shizukuStatus");if(!box)return;box.className="shizuku-status "+kind;const strong=box.querySelector("strong"),small=box.querySelector("small");if(strong)strong.textContent=title;if(small)small.textContent=detail;const grant=$("shizukuGrantBtn");if(grant)grant.disabled=!canRequest}
function check(){if(!bridge||typeof bridge.getShizukuStatus!=="function"){shizuku("","Disponível somente no APK Android","O painel web não possui conexão nativa.",false);return}let s=null;try{s=parse(typeof bridge.runShizukuDiagnostics==="function"?bridge.runShizukuDiagnostics():bridge.getShizukuStatus())}catch(error){shizuku("","Falha na consulta",String(error?.message||"Não foi possível consultar o Binder do Shizuku."),false);return}if(!s||!s.running)shizuku("","Shizuku não está ativo",s?.message||"Inicie o serviço no app Shizuku e verifique novamente.",false);else if(s.granted)shizuku("ready","Shizuku ativo e SENSI.AI autorizado",s.message||"Autorização confirmada. Os módulos Shizuku estão liberados.",false);else shizuku("denied","Autorização pendente",s.message||"Conceda a permissão ao SENSI.AI no Shizuku.",true)}
document.addEventListener("DOMContentLoaded",()=>{
// Inicialize referências DOM antes de qualquer leitura. Declarar const depois do primeiro uso
// causava ReferenceError (TDZ) e interrompia todos os listeners do Hub e do Massinha.
const massinhaPackage=$("massinhaTargetPackage");
const optimizerGameTarget=$("optimizerGameTarget");
const optimizerCustomPackage=$("optimizerCustomPackage");
const confirmCancel=$("boostConfirmCancel"),confirmAccept=$("boostConfirmAccept"),confirmModal=$("boostConfirmModal");
confirmCancel?.addEventListener("click",()=>{closeBoostConfirm();applyStatus("Aplicação cancelada. Nenhuma alteração foi feita.");});
confirmAccept?.addEventListener("click",()=>{const payload=parse(confirmModal?.dataset.pending||"");closeBoostConfirm();if(payload)executeConfirmedTweaks(payload);else applyStatus("Confirmação expirada. Nenhuma alteração foi feita.");});
document.querySelectorAll("#tab-boost input[type=checkbox]").forEach(x=>x.addEventListener("change",syncCount));

const GAME_TARGETS={
 "com.dts.freefireth":{name:"Free Fire",family:"freefire"},
 "com.dts.freefiremax":{name:"Free Fire MAX",family:"freefire"},
 "com.roblox.client":{name:"Roblox",family:"roblox"},
 "com.activision.callofduty.shooter":{name:"Call of Duty: Mobile",family:"codm"},
 "com.tencent.ig":{name:"PUBG Mobile",family:"pubgm"},
 "com.mojang.minecraftpe":{name:"Minecraft",family:"minecraft"},
 "com.mobile.legends":{name:"Mobile Legends: Bang Bang",family:"mlbb"},
 "com.supercell.brawlstars":{name:"Brawl Stars",family:"brawlstars"},
 "com.kitkagames.fallbuddies":{name:"Stumble Guys",family:"stumbleguys"}
};
const GAME_TARGET_KEY="sensi_ai_optimizer_game_v1";
function currentGameTarget(){const selected=optimizerGameTarget?.value||"com.dts.freefireth";if(selected==="custom")return {package:(optimizerCustomPackage?.value||"").trim(),name:"Outro jogo",family:"other"};return {package:selected,...(GAME_TARGETS[selected]||{name:"Jogo selecionado",family:"other"})};}
function syncGameTarget(){
 const target=currentGameTarget(),massinhaOption=document.querySelector('#boostMultiGrid input[value="massinha"]');
 try{localStorage.setItem(GAME_TARGET_KEY,optimizerGameTarget?.value||target.package)}catch(_){}
 const isCustom=optimizerGameTarget?.value==="custom";$("optimizerCustomGameField")?.classList.toggle("hidden",!isCustom);
 const supportsMassinha=target.family==="freefire";
 if(massinhaOption){massinhaOption.disabled=!supportsMassinha;if(!supportsMassinha)massinhaOption.checked=false;massinhaOption.closest(".boost-option")?.classList.toggle("is-disabled",!supportsMassinha);}
 put("optimizerGameStatus",target.package?"Jogo-alvo: "+target.name+" · pacote "+target.package:"Informe o pacote do jogo para continuar.");
 put("optimizerGameHint",supportsMassinha?"Free Fire é o foco principal e oferece os módulos específicos, incluindo Gráfico Massinha.":"Modo universal: os módulos Android compatíveis usam o jogo selecionado. Gráfico Massinha não se aplica a este jogo.");
 syncCount();
}

if(optimizerGameTarget){try{const saved=localStorage.getItem(GAME_TARGET_KEY);if(saved&&(GAME_TARGETS[saved]||saved==="custom"))optimizerGameTarget.value=saved;}catch(_){}optimizerGameTarget.addEventListener("change",syncGameTarget);optimizerCustomPackage?.addEventListener("input",syncGameTarget);syncGameTarget();}

function massinhaCommands(){
 const pkg=massinhaPackage?.value||"com.dts.freefireth";
 const v1="settings put global angle_gl_driver_selection_pkgs "+pkg+" && settings put global angle_gl_driver_selection_values angle && setprop debug.angle.feature_overrides_enabled disableAnisotropicFiltering:forceTextureLodOffset4 && am force-stop "+pkg;
 const v2="settings put global angle_gl_driver_selection_pkgs "+pkg+" && settings put global angle_gl_driver_selection_values angle && setprop debug.angle.feature_overrides_enabled forceNearestFiltering:disableAnisotropicFiltering:forceTextureLodOffset4 && am force-stop "+pkg;
 const fieldV1=$("massinhaCommandV1"),fieldV2=$("massinhaCommandV2");if(fieldV1)fieldV1.value=v1;if(fieldV2)fieldV2.value=v2;
 return {v1,v2};
}
function detectMassinhaDevice(){
 const info=$("massinhaDeviceInfo");
 if(!bridge||typeof bridge.getDeviceSnapshot!=="function"){if(info)info.textContent="Detecção automática disponível na versão APK Android. Selecione o jogo manualmente.";massinhaCommands();return;}
 const device=parse(bridge.getDeviceSnapshot());
 if(!device){if(info)info.textContent="Não foi possível ler o aparelho. Selecione o jogo manualmente.";massinhaCommands();return;}
 const installedFF=!!device.freeFireInstalled,installedMax=!!device.freeFireMaxInstalled;
 if(installedFF&&!installedMax)massinhaPackage.value="com.dts.freefireth";
 else if(installedMax&&!installedFF)massinhaPackage.value="com.dts.freefiremax";
 else if(installedFF&&installedMax){const preferred=appSettings.gameEdition==="freefiremax"?"com.dts.freefiremax":"com.dts.freefireth";massinhaPackage.value=preferred;}
 const gameLabel=installedFF&&installedMax?"Free Fire e Free Fire MAX instalados":installedMax?"Free Fire MAX detectado":installedFF?"Free Fire detectado":"Nenhuma edição encontrada, selecione manualmente";
 if(info)info.textContent=(device.manufacturer+" "+device.model+" · "+gameLabel);
 massinhaCommands();
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
function selectBoostProfile(profile){
 const target=Object.prototype.hasOwnProperty.call(recommended,profile)?profile:"stable";
 activeBoostProfile=target;
 if($("boostUseCase"))$("boostUseCase").value=target;
 setSelected(recommended[target]);
 document.querySelectorAll("[data-boost-profile]").forEach(x=>x.classList.toggle("active",x.getAttribute("data-boost-profile")===target));
 put("boostApplyStatus","Perfil "+target+" selecionado. Animações usam Shizuku; as demais etapas têm atalhos próprios no plano.");
}
function applySelectedBoostProfile(){
 const profile=$("boostUseCase")?.value||activeBoostProfile||"stable";
 selectBoostProfile(profile);
 buildPlan();
 try{refresh()}catch(_){put("boostAdvice","Diagnóstico indisponível nesta execução. O plano ainda pode ser consultado.");}
 startApplyTweaks();
}
document.querySelectorAll("[data-boost-profile]").forEach(button=>button.addEventListener("click",()=>{
 selectBoostProfile(button.getAttribute("data-boost-profile")||"stable");
}));
$("boostUseCase")?.addEventListener("change",e=>selectBoostProfile(e.target.value));
$("boostApplyProfileBtn")?.addEventListener("click",applySelectedBoostProfile);
$("boostLaunchGame")?.addEventListener("click",()=>openFreeFire(true));
$("boostOpenDisplaySettings")?.addEventListener("click",()=>{const ok=bridge&&typeof bridge.openTweakSettings==="function"&&bridge.openTweakSettings("display");put("boostApplyStatus",ok?"Configurações de tela abertas. As alterações são feitas por você no Android.":"Esse painel está disponível somente no APK Android.")});
$("boostOpenBatterySettings")?.addEventListener("click",()=>{const ok=bridge&&typeof bridge.openTweakSettings==="function"&&bridge.openTweakSettings("battery");put("boostApplyStatus",ok?"Configurações de bateria abertas.":"Esse painel está disponível somente no APK Android.")});
$("boostCopyReport")?.addEventListener("click",copySystemReport);
$("boostSelectAll")?.addEventListener("click",()=>setSelected(Object.keys(guides).filter(key=>key!=="massinha")));
$("boostClearSelection")?.addEventListener("click",()=>setSelected([]));
$("massinhaTargetPackage")?.addEventListener("change",massinhaCommands);
$("massinhaExecutionMode")?.addEventListener("change",()=>{
 const isBrevent=$("massinhaExecutionMode").value==="brevent";
 put("massinhaCopyStatus",isBrevent?"Brevent selecionado para o Gráfico Massinha. Copie V1 ou V2 e execute no Brevent.":"Shizuku selecionado para Massinha. Os outros módulos continuam usando Shizuku.");
});
$("copyBreventCommand")?.addEventListener("click",copyBreventCommand);
$("massinhaCopyV1")?.addEventListener("click",()=>copyMassinha("v1"));
$("massinhaCopyV2")?.addEventListener("click",()=>copyMassinha("v2"));
massinhaCommands();
detectMassinhaDevice();
$("boostBuildPlan")?.addEventListener("click",buildPlan);
$("boostApplyTweaks")?.addEventListener("click",startApplyTweaks);

$("boostRestoreTweaks")?.addEventListener("click",()=>{
 if(!bridge||typeof bridge.restoreSafeTweak!=="function"||typeof bridge.restoreMassinhaTweak!=="function"){applyStatus("A restauração exige o APK Android com Shizuku atualizado.");return}
 try{
  const a=parse(bridge.restoreSafeTweak("animations"));
  const m=parse(bridge.restoreMassinhaTweak());
  const pkg=$("massinhaTargetPackage")?.value||"com.dts.freefireth";
  const hz=typeof bridge.restoreBenimaruRefreshRate==="function"?parse(bridge.restoreBenimaruRefreshRate()):null;
  const sh=typeof bridge.restoreBenimaruShaderDriver==="function"?parse(bridge.restoreBenimaruShaderDriver(pkg)):null;
  const gm=typeof bridge.restoreGameMode==="function"?parse(bridge.restoreGameMode(pkg)):null;
  const messages=[];
  if(hz?.ok)messages.push("Taxa de atualização: "+(hz.message||"restaurada."));
  else if(hz?.message&&!hz.message.includes("Nenhum backup"))messages.push("Taxa de atualização: "+hz.message);
  if(sh?.ok)messages.push("Driver gráfico: "+(sh.message||"restaurado."));
  else if(sh?.message&&!sh.message.includes("Nenhum backup"))messages.push("Driver gráfico: "+sh.message);
  if(gm?.ok)messages.push("Modo de jogo: "+(gm.message||"restaurado."));
  else if(gm?.message&&!gm.message.includes("Nenhum modo performance"))messages.push("Modo de jogo: "+gm.message);
  if(a?.ok)messages.push("Animações: "+(a.message||"backup restaurado."));
  else messages.push("Animações: "+(a?.message||"não foi possível restaurar."));
  if(m?.ok)messages.push("Gráficos Massinha: "+(m.message||"backup restaurado."));
  else messages.push("Gráficos Massinha: "+(m?.message||"não foi possível restaurar."));
  applyStatus(messages.join(" "));
 }catch(error){applyStatus("Falha ao restaurar: "+String(error?.message||"verifique Shizuku."))}
});
$("boostRefreshBtn")?.addEventListener("click",()=>{try{refresh()}catch(_){put("boostAdvice","Não foi possível ler os dados do Android. Tente novamente.")}});
$("heatShieldRefresh")?.addEventListener("click",()=>{try{refresh()}catch(_){updateHeatShield(lastDeviceSnapshot);put("heatShieldAdvice","Não foi possível atualizar a leitura. Tente novamente.")}});
$("shizukuCheckBtn")?.addEventListener("click",()=>{try{check()}catch(_){shizuku("","Falha na consulta","Verifique se o serviço está ativo.",false)}});
$("shizukuGrantBtn")?.addEventListener("click",()=>{try{if(bridge&&typeof bridge.requestShizukuPermission==="function"){const message=bridge.requestShizukuPermission();shizuku("","Solicitação de autorização",message||"Confira a confirmação no Shizuku e depois toque em verificar.",false)}}catch(error){shizuku("","Falha ao solicitar",String(error?.message||"Não foi possível abrir o pedido de autorização."),false)}});
$("settingAutoOpenFF")?.addEventListener("change",e=>{appSettings.autoOpenFreeFire=e.target.checked;saveSettings();put("settingsStatus",e.target.checked?"O Free Fire será aberto ao concluir os tweaks.":"A abertura automática foi desativada.")});
$("settingGameEdition")?.addEventListener("change",e=>{appSettings.gameEdition=e.target.value;saveSettings();put("settingsStatus","Versão preferida salva neste aparelho.")});
$("settingsOpenFF")?.addEventListener("click",()=>openFreeFire(true));
$("settingsReset")?.addEventListener("click",()=>{appSettings={...defaultSettings};saveSettings();syncSettingsUI();put("settingsStatus","Preferências restauradas para os padrões.")});
syncSettingsUI();
put("boostDevice","Diagnóstico pronto. Atualize quando quiser.");put("boostLastCheck","Nenhuma leitura nativa nesta sessão");put("boostAdvice","Toque em Atualizar diagnóstico para consultar memória, bateria, temperatura e display.");updateHeatShield(null);shizuku("","Consulta sob demanda","Toque em verificar Shizuku quando quiser.",false);syncCount();
});
})();