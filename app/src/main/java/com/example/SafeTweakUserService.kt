package com.example
import android.os.Binder
import android.os.Parcel
import org.json.JSONObject

/** Shizuku UserService: Shizuku instantiates this class as an IBinder. */
class SafeTweakUserService : Binder() {
 companion object {
  const val DESCRIPTOR="com.example.SENSIAI_SAFE_TWEAKS"
  private const val APPLY_ANIMATIONS=1
  private const val RESTORE_ANIMATIONS=2
  private const val APPLY_MASSINHA=3
  private const val RESTORE_MASSINHA=4
  private const val TEST_ACCESS=5
  private const val COMPILE_GAME=6
  private const val APPLY_GAME_MODE=7
  private const val RESTORE_GAME_MODE=8
  private const val APPLY_SHADER_DRIVER=9
  private const val RESTORE_SHADER_DRIVER=10
  private const val APPLY_REFRESH_RATE=11
  private const val RESTORE_REFRESH_RATE=12
  private val animKeys=listOf("window_animation_scale","transition_animation_scale","animator_duration_scale")
  private const val SETTINGS="/system/bin/settings"
  private const val GETPROP="/system/bin/getprop"
  private const val SETPROP="/system/bin/setprop"
  private const val AM="/system/bin/am"
  private const val PKGS="angle_gl_driver_selection_pkgs"
  private const val VALUES="angle_gl_driver_selection_values"
  private const val PROP="debug.angle.feature_overrides_enabled"
  private val allowed=setOf("com.dts.freefireth", "com.dts.freefiremax", "com.roblox.client", "com.activision.callofduty.shooter", "com.tencent.ig", "com.mojang.minecraftpe", "com.mobile.legends", "com.supercell.brawlstars", "com.kitkagames.fallbuddies")
  private val allowedMassinha=setOf("com.dts.freefireth","com.dts.freefiremax")
  private fun isAllowedGamePackage(pkg:String):Boolean = pkg in allowed || Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+$").matches(pkg)
 }

 override fun onTransact(code:Int,data:Parcel,reply:Parcel?,flags:Int):Boolean {
  if(code !in APPLY_ANIMATIONS..RESTORE_REFRESH_RATE)return super.onTransact(code,data,reply,flags)
  data.enforceInterface(DESCRIPTOR)
  val result=try{when(code){
   APPLY_ANIMATIONS->applyAnimations()
   RESTORE_ANIMATIONS->restoreAnimations(data.readString().orEmpty())
   APPLY_MASSINHA->applyMassinha(data.readString().orEmpty())
   RESTORE_MASSINHA->restoreMassinha(data.readString().orEmpty())
   TEST_ACCESS->testAccess()
   COMPILE_GAME->compileGame(data.readString().orEmpty())
   APPLY_GAME_MODE->gameMode(data.readString().orEmpty(), true)
   RESTORE_GAME_MODE->gameMode(data.readString().orEmpty(), false)
   APPLY_SHADER_DRIVER->applyShaderDriver(data.readString().orEmpty())
   RESTORE_SHADER_DRIVER->restoreShaderDriver(data.readString().orEmpty())
   APPLY_REFRESH_RATE->applyRefreshRate(data.readString().orEmpty())
   RESTORE_REFRESH_RATE->restoreRefreshRate(data.readString().orEmpty())
   else->JSONObject().put("ok",false)
  }}catch(e:Throwable){JSONObject().put("ok",false).put("message",e.message?:"Shizuku operation failed")}
  reply?.writeNoException();reply?.writeString(result.toString());return true
 }

 private fun gameMode(pkg:String, performance:Boolean):JSONObject {
  require(pkg in allowed) { "Pacote de jogo não permitido." }
  val mode=if(performance) "performance" else "standard"
  var result=run("/system/bin/cmd","game","mode",mode,pkg)
  if(result.first!=0 && performance) result=run("/system/bin/cmd","game","mode","2",pkg)
  if(result.first!=0) return JSONObject().put("ok",false).put("exitCode",result.first).put("message","Modo de jogo não suportado ou recusado: "+result.second)
  return JSONObject().put("ok",true).put("exitCode",result.first).put("message",if(performance) "Modo de desempenho solicitado para $pkg." else "Modo padrão restaurado para $pkg.")
 }
 private fun compileGame(pkg:String):JSONObject {
  require(pkg in allowed) { "Pacote de jogo não permitido." }
  val result=run("/system/bin/cmd","package","compile","-m","speed","-f",pkg)
  if(result.first!=0) return JSONObject().put("ok",false).put("exitCode",result.first).put("message","Compilação do jogo falhou: "+result.second)
  return JSONObject().put("ok",true).put("exitCode",result.first).put("message","Compilação ART speed -f concluída para "+pkg+".")
 }
 private fun applyRefreshRate(raw:String):JSONObject {
  val q=JSONObject(raw)
  val hz=q.getInt("hz")
  require(hz in 30..240) { "Taxa de atualização fora do intervalo permitido." }
  val oldMin=run(SETTINGS,"get","system","min_refresh_rate")
  val oldMax=run(SETTINGS,"get","system","peak_refresh_rate")
  if(oldMin.first!=0||oldMax.first!=0) error("Não foi possível ler os valores atuais de Hz.")
  val backup=JSONObject().put("min",oldMin.second.trim().ifBlank{"null"}).put("max",oldMax.second.trim().ifBlank{"null"})
  try {
   val a=run(SETTINGS,"put","system","min_refresh_rate",hz.toString())
   if(a.first!=0) error("Falha ao definir Hz mínimo: "+a.second)
   val b=run(SETTINGS,"put","system","peak_refresh_rate",hz.toString())
   if(b.first!=0) error("Falha ao definir Hz máximo: "+b.second)
  } catch(e:Throwable) {
   restoreRefreshRate(backup.toString())
   throw e
  }
  return JSONObject().put("ok",true).put("backup",backup).put("message","Taxa de atualização solicitada em $hz Hz. O painel pode limitar valores não suportados.")
 }
 private fun restoreRefreshRate(raw:String):JSONObject {
  val b=JSONObject(raw)
  writeSystemSetting("min_refresh_rate",b.getString("min"))
  writeSystemSetting("peak_refresh_rate",b.getString("max"))
  return JSONObject().put("ok",true).put("message","Taxa de atualização anterior restaurada.")
 }
 private fun writeSystemSetting(key:String,value:String) {
  val r=if(value=="null") run(SETTINGS,"delete","system",key) else run(SETTINGS,"put","system",key,value)
  if(r.first!=0) error("Falha ao restaurar $key: "+r.second)
 }
 private fun readSetting(key:String):String {
  val r=run(SETTINGS,"get","global",key)
  if(r.first!=0) error("Falha ao ler $key: "+r.second)
  return r.second.trim().ifBlank{"null"}
 }
 private fun writeSetting(key:String,value:String) {
  val r=if(value=="null") run(SETTINGS,"delete","global",key) else run(SETTINGS,"put","global",key,value)
  if(r.first!=0) error("Falha ao gravar $key: "+r.second)
 }
 private fun applyShaderDriver(raw:String):JSONObject {
  val q=JSONObject(raw)
  val pkg=q.getString("package")
  val driver=q.getString("driver")
  require(isAllowedGamePackage(pkg)) { "Pacote não permitido." }
  require(driver in setOf("angle","native","default")) { "Driver inválido." }
  val oldPkgs=readSetting(PKGS)
  val oldValues=readSetting(VALUES)
  val packages=if(oldPkgs=="null") mutableListOf() else oldPkgs.split(",").map{it.trim()}.filter{it.isNotEmpty()}.toMutableList()
  val values=if(oldValues=="null") mutableListOf() else oldValues.split(",").map{it.trim()}.toMutableList()
  if(packages.size!=values.size) error("Mapa ANGLE inconsistente. Nenhuma alteração foi aplicada.")
  val backup=JSONObject().put("package",pkg).put("packages",oldPkgs).put("values",oldValues)
  val index=packages.indexOf(pkg)
  if(driver=="default") { if(index>=0){packages.removeAt(index);values.removeAt(index)} }
  else if(index>=0) values[index]=driver else {packages.add(pkg);values.add(driver)}
  try {
   writeSetting(PKGS,if(packages.isEmpty()) "null" else packages.joinToString(","))
   writeSetting(VALUES,if(values.isEmpty()) "null" else values.joinToString(","))
  } catch(e:Throwable) {
   writeSetting(PKGS,oldPkgs);writeSetting(VALUES,oldValues);throw e
  }
  return JSONObject().put("ok",true).put("backup",backup).put("message","Driver gráfico $driver configurado para $pkg. Reinicie o jogo para testar.")
 }
 private fun restoreShaderDriver(raw:String):JSONObject {
  val b=JSONObject(raw)
  val pkg=b.getString("package")
  require(isAllowedGamePackage(pkg)) { "Pacote não permitido." }
  writeSetting(PKGS,b.getString("packages"))
  writeSetting(VALUES,b.getString("values"))
  return JSONObject().put("ok",true).put("message","Configuração de driver gráfico original restaurada para $pkg.")
 }
 private fun testAccess():JSONObject {
  // Read-only probe. This command runs inside the Shizuku-managed process.
  val result=run("/system/bin/id")
  if(result.first!=0) return JSONObject().put("ok",false).put("message","UserService iniciou, mas a consulta de identidade falhou: "+result.second)
  return JSONObject().put("ok",true).put("remoteIdentity",result.second).put("remoteExitCode",result.first)
 }
 private fun applyAnimations():JSONObject {
  val backup=JSONObject()
  animKeys.forEach{key->val r=run(SETTINGS,"get","global",key);if(r.first!=0)error("Read failed: "+key);backup.put(key,r.second.trim().ifBlank{"null"})}
  try{animKeys.forEach{key->val r=run(SETTINGS,"put","global",key,"0.5");if(r.first!=0)error("Write failed: "+key)}}
  catch(e:Throwable){animKeys.forEach{restoreSetting(it,backup.optString(it,"null"))};throw e}
  return JSONObject().put("ok",true).put("message","Animações 0,5x aplicadas.").put("backup",backup)
 }
 private fun restoreAnimations(raw:String):JSONObject {
  val b=JSONObject(raw);animKeys.forEach{key->if(!b.has(key))error("Backup incompleto")}
  animKeys.forEach{restoreSetting(it,b.getString(it))}
  return JSONObject().put("ok",true).put("message","Animações originais restauradas.")
 }
 private fun applyMassinha(raw:String):JSONObject {
  val q=JSONObject(raw);val version=q.getString("version");val pkg=q.getString("package")
  require(version=="v1"||version=="v2");require(pkg in allowedMassinha)
  val p=run(SETTINGS,"get","global",PKGS);val v=run(SETTINGS,"get","global",VALUES);val g=run(GETPROP,PROP)
  if(p.first!=0||v.first!=0||g.first!=0)error("Não foi possível ler configurações ANGLE.")
  val oldP=p.second.trim().ifBlank{"null"};val oldV=v.second.trim().ifBlank{"null"};val oldG=g.second.trim()
  val packages=if(oldP=="null") mutableListOf() else oldP.split(",").map{it.trim()}.filter{it.isNotEmpty()}.toMutableList()
  val values=if(oldV=="null") mutableListOf() else oldV.split(",").map{it.trim()}.toMutableList()
  if(packages.size!=values.size)error("Lista ANGLE inconsistente. Operação cancelada para preservar outros apps.")
  val index=packages.indexOf(pkg);if(index>=0)values[index]="angle" else {packages.add(pkg);values.add("angle")}
  val backup=JSONObject().put("packages",oldP).put("values",oldV).put("property",oldG).put("package",pkg)
  try{
   putSetting(PKGS,packages.joinToString(","));putSetting(VALUES,values.joinToString(","))
   val feature=if(version=="v1")"disableAnisotropicFiltering:forceTextureLodOffset4" else "forceNearestFiltering:disableAnisotropicFiltering:forceTextureLodOffset4"
   val prop=run(SETPROP,PROP,feature);if(prop.first!=0)error("setprop recusado: "+prop.second)
   val stop=run(AM,"force-stop",pkg);if(stop.first!=0)error("force-stop falhou: "+stop.second)
  }catch(e:Throwable){restoreAngle(oldP,oldV,oldG);throw e}
  return JSONObject().put("ok",true).put("backup",backup).put("message","Gráfico Massinha "+version.uppercase()+" aplicado. Free Fire encerrado para recarregar.")
 }
 private fun restoreMassinha(raw:String):JSONObject {
  val b=JSONObject(raw);val pkg=b.getString("package");require(pkg in allowedMassinha)
  restoreAngle(b.getString("packages"),b.getString("values"),b.getString("property"))
  val stop=run(AM,"force-stop",pkg);if(stop.first!=0)error("Configuração restaurada, mas force-stop falhou.")
  return JSONObject().put("ok",true).put("message","Configuração ANGLE original restaurada; jogo encerrado para recarregar.")
 }
 private fun restoreAngle(p:String,v:String,g:String){
  if(p=="null"){val r=run(SETTINGS,"delete","global",PKGS);if(r.first!=0)error("Falha ao restaurar packages.")}else putSetting(PKGS,p)
  if(v=="null"){val r=run(SETTINGS,"delete","global",VALUES);if(r.first!=0)error("Falha ao restaurar values.")}else putSetting(VALUES,v)
  val r=run(SETPROP,PROP,g);if(r.first!=0)error("Falha ao restaurar propriedade.")
 }
 private fun putSetting(k:String,v:String){val r=run(SETTINGS,"put","global",k,v);if(r.first!=0)error("Falha ao gravar "+k)}
 private fun restoreSetting(k:String,v:String){val r=if(v=="null")run(SETTINGS,"delete","global",k)else run(SETTINGS,"put","global",k,v);if(r.first!=0)error("Falha ao restaurar "+k)}
 private fun run(vararg args:String):Pair<Int,String>{val p=ProcessBuilder(args.toList()).redirectErrorStream(true).start();val out=p.inputStream.bufferedReader().use{it.readText()}.trim();return p.waitFor() to out}
}
