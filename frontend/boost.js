(() => {
"use strict";
const $=id=>document.getElementById(id), bridge=window.AndroidBridge||null;
const parse=v=>{try{return JSON.parse(v)}catch(_){return null}};
const put=(id,v)=>{const e=$(id);if(e)e.textContent=v};
function shizuku(kind,title,detail,canRequest){const box=$("shizukuStatus");if(!box)return;box.className="shizuku-status "+kind;box.querySelector("strong").textContent=title;box.querySelector("small").textContent=detail;$("shizukuGrantBtn").disabled=!canRequest}
function thermal(n){return ({0:"Normal",1:"Leve",2:"Moderado",3:"Alto",4:"Severo",5:"Crítico",6:"Emergência"})[n]||"Não informado"}
function refresh(){let d=null;if(bridge&&typeof bridge.getDeviceSnapshot==="function")d=parse(bridge.getDeviceSnapshot());
if(!d){put("boostDevice","Modo navegador: diagnóstico Android nativo indisponível.");put("boostMemory","N/D");put("boostMemoryHint","Disponível no APK");put("boostBattery","N/D");put("boostBatteryHint","Disponível no APK");put("boostTemp","N/D");put("boostTempHint","Disponível no APK");put("boostAndroid",/Android/i.test(navigator.userAgent)?"Android":"Web");put("boostAndroidHint","Sem leitura nativa");put("boostAdvice","Abra a versão APK para consultar as informações fornecidas pelo Android. Nenhuma configuração foi alterada.");return}
put("boostDevice",(d.manufacturer+" "+d.model).trim());put("boostMemory",d.availableMemoryMb>=0?Math.round(d.availableMemoryMb)+" MB":"N/D");put("boostMemoryHint",d.totalMemoryMb>0?"de "+Math.round(d.totalMemoryMb)+" MB totais":"Leitura indisponível");put("boostBattery",d.batteryPercent>=0?d.batteryPercent+"%":"N/D");put("boostBatteryHint","Nível informado pelo Android");put("boostTemp",d.batteryTempC>=0?Number(d.batteryTempC).toFixed(1)+" °C":"N/D");put("boostTempHint",thermal(d.thermalStatus));put("boostAndroid",d.android||"N/D");put("boostAndroidHint","API "+(d.sdk||"N/D"));
const tips=[];if(d.batteryTempC>=45)tips.push("Temperatura da bateria elevada. Faça uma pausa e deixe o aparelho esfriar naturalmente, fora do sol.");else if(d.batteryTempC>=0)tips.push("Temperatura da bateria sem alerta imediato.");if(d.availableMemoryMb>=0&&d.totalMemoryMb>0&&d.availableMemoryMb/d.totalMemoryMb<.12)tips.push("Pouca memória disponível. Feche manualmente apps que não está usando.");if(d.lowMemory)tips.push("O Android sinalizou pouca memória.");if(d.thermalStatus>=3)tips.push("Estado térmico elevado. Reduza a carga gráfica e aguarde o aparelho esfriar.");if(!tips.length)tips.push("Sem alertas claros nos dados fornecidos pelo Android. Isso não substitui um teste de estabilidade no jogo.");put("boostAdvice",tips.join(" "))}
function check(){if(!bridge||typeof bridge.getShizukuStatus!=="function"){shizuku("","Disponível somente no APK Android","O painel web não possui conexão nativa com Shizuku.",false);return}const s=parse(bridge.getShizukuStatus());if(!s||!s.running)shizuku("","Shizuku não está ativo","Inicie o serviço no app Shizuku e verifique novamente.",false);else if(s.granted)shizuku("ready","Serviço ativo e autorização concedida","Nenhum comando privilegiado será executado por esta versão.",false);else shizuku("denied","Serviço ativo, autorização pendente","Você pode solicitar a permissão. A escolha continua sendo sua.",true)}
document.addEventListener("DOMContentLoaded",()=>{
  $("boostRefreshBtn")?.addEventListener("click",()=>{
    try { refresh(); } catch (_) { put("boostAdvice","Não foi possível ler os dados do Android. O restante do app continua disponível."); }
  });
  $("shizukuCheckBtn")?.addEventListener("click",()=>{
    try { check(); } catch (_) { shizuku("","Não foi possível consultar o Shizuku","Verifique se o serviço está ativo e tente novamente.",false); }
  });
  $("shizukuGrantBtn")?.addEventListener("click",()=>{
    try {
      if(bridge&&typeof bridge.requestShizukuPermission==="function"){
        bridge.requestShizukuPermission();
        shizuku("","Solicitação enviada","Conclua ou negue no Shizuku e depois toque em verificar.",false);
      }
    } catch (_) { shizuku("","Falha ao solicitar autorização","O SENSI.AI continua funcionando sem Shizuku.",false); }
  });
  put("boostDevice","Diagnóstico pronto. Atualize quando quiser.");
  put("boostAdvice","Nenhuma leitura é executada automaticamente ao abrir o app. Toque em atualizar para consultar o Android.");
  shizuku("","Consulta sob demanda","Toque em verificar Shizuku quando quiser consultar o serviço.",false);
});
})();