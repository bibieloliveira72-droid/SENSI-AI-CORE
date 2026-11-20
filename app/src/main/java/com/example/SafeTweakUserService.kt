package com.example
import android.os.Binder
import android.os.Parcel
import org.json.JSONObject

/** Strict Shizuku allowlist. No arbitrary shell input. */
class SafeTweakUserService : Binder() {
 companion object {
  const val DESCRIPTOR="com.example.SENSIAI_SAFE_TWEAKS"
  private const val APPLY_ANIMATIONS=1
  private const val RESTORE_ANIMATIONS=2
  private const val APPLY_MASSINHA=3
  private const val RESTORE_MASSINHA=4
  private const val TEST_ACCESS=5
  private val animKeys=listOf("window_animation_scale","transition_animation_scale","animator_duration_scale")
  private const val SETTINGS="/system/bin/settings"
  private const val GETPROP="/system/bin/getprop"
  private const val SETPROP="/system/bin/setprop"
  private const val AM="/system/bin/am"
  private const val PKGS="angle_gl_driver_selection_pkgs"
  private const val VALUES="angle_gl_driver_selection_values"
  private const val PROP="debug.angle.feature_overrides_enabled"
  private val allowed=setOf("com.dts.freefireth","com.dts.freefiremax")
 }
 override fun onTransact(code:Int,data:Parcel,reply:Parcel?,flags:Int):Boolean {
  if(code !in APPLY_ANIMATIONS..TEST_ACCESS)return super.onTransact(code,data,reply,flags)
  data.enforceInterface(DESCRIPTOR)
  val result=try{when(code){
   APPLY_ANIMATIONS->applyAnimations()
   RESTORE_ANIMATIONS->restoreAnimations(data.readString().orEmpty())
   APPLY_MASSINHA->applyMassinha(data.readString().orEmpty())
   RESTORE_MASSINHA->restoreMassinha(data.readString().orEmpty())
   TEST_ACCESS->testAccess()
   else->JSONObject().put("ok",false)
  }}catch(e:Throwable){JSONObject().put("ok",false).put("message",e.message?:"Shizuku operation failed")}
  reply?.writeNoException();reply?.writeString(result.toString());return true
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
  require(version=="v1"||version=="v2");require(pkg in allowed)
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
  val b=JSONObject(raw);val pkg=b.getString("package");require(pkg in allowed)
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
