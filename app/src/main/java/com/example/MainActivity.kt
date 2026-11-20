package com.example

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.ContextWrapper
import android.content.ComponentName
import android.content.ServiceConnection
import android.os.IBinder
import android.os.Parcel
import android.os.RemoteException
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import android.app.ActivityManager
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.provider.Settings
import android.os.BatteryManager
import android.os.Build
import android.os.PowerManager
import android.content.pm.PackageManager
import org.json.JSONObject
import rikka.shizuku.Shizuku
import android.graphics.Color as AndroidColor
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  private val shizukuPermissionListener =
    Shizuku.OnRequestPermissionResultListener { requestCode, grantResult ->
      if (requestCode == 2407) {
        // The Hub reads the definitive state again when the user taps "Verificar".
      }
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    Shizuku.addRequestPermissionResultListener(shizukuPermissionListener)

    val darkBar = AndroidColor.parseColor("#070709")
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(darkBar),
      navigationBarStyle = SystemBarStyle.dark(darkBar),
    )

    setContent {
      MyApplicationTheme {
        SensiOfflineWebHost()
      }
    }
  }

  override fun onDestroy() {
    Shizuku.removeRequestPermissionResultListener(shizukuPermissionListener)
    super.onDestroy()
  }
}

private class AndroidClipboardBridge(private val activity: ComponentActivity) {
  private val context: Context = activity.applicationContext
  @JavascriptInterface
  fun getDeviceSnapshot(): String {
    val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    val memory = ActivityManager.MemoryInfo()
    manager.getMemoryInfo(memory)
    val battery = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    val temp = battery?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1
    val level = battery?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
    val scale = battery?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
    val percent = if (level >= 0 && scale > 0) (level * 100) / scale else -1
    val thermal = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      (context.getSystemService(Context.POWER_SERVICE) as PowerManager).currentThermalStatus
    } else -1
    return JSONObject().apply {
      put("manufacturer", Build.MANUFACTURER)
      put("model", Build.MODEL)
      put("android", Build.VERSION.RELEASE)
      put("sdk", Build.VERSION.SDK_INT)
      put("totalMemoryMb", memory.totalMem / (1024 * 1024))
      put("availableMemoryMb", memory.availMem / (1024 * 1024))
      put("lowMemory", memory.lowMemory)
      put("batteryPercent", percent)
      put("batteryTempC", if (temp >= 0) temp / 10.0 else -1)
      put("thermalStatus", thermal)
    }.toString()
  }

  @JavascriptInterface
  fun getShizukuStatus(): String {
    val running = try { Shizuku.pingBinder() } catch (_: Throwable) { false }
    val granted = running && try {
      Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
    } catch (_: Throwable) { false }
    return JSONObject().put("running", running).put("granted", granted).toString()
  }

  @JavascriptInterface
  fun requestShizukuPermission(): String {
    val result = arrayOf("Não foi possível iniciar a solicitação do Shizuku.")
    val latch = CountDownLatch(1)
    activity.runOnUiThread {
      try {
        if (!Shizuku.pingBinder()) {
          result[0] = "Shizuku não está ativo. Inicie o serviço primeiro."
        } else if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
          result[0] = "O SENSI.AI já está autorizado no Shizuku."
        } else {
          Shizuku.requestPermission(2407)
          result[0] = "Pedido de autorização enviado ao Shizuku. Conclua a confirmação exibida."
        }
      } catch (error: Throwable) {
        result[0] = "Falha ao solicitar autorização: ${error.message ?: "erro desconhecido"}"
      } finally {
        latch.countDown()
      }
    }
    try { latch.await(3, TimeUnit.SECONDS) } catch (_: InterruptedException) {
      Thread.currentThread().interrupt()
    }
    return result[0]
  }


  @JavascriptInterface
  fun runShizukuDiagnostics(): String {
    // Verificação temporariamente limitada ao estado do Binder e à autorização do app.
    // Não inicia UserService nem executa teste de compatibilidade enquanto o Hub estiver instável.
    val running = try { Shizuku.pingBinder() } catch (_: Throwable) { false }
    val granted = running && try {
      Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
    } catch (_: Throwable) { false }

    val message = when {
      !running -> "Shizuku não está ativo. Inicie o serviço e tente novamente."
      !granted -> "Shizuku está ativo, mas o SENSI.AI ainda não recebeu autorização."
      else -> "Shizuku está ativo e a autorização do SENSI.AI foi confirmada. Teste de compatibilidade temporariamente desativado."
    }
    return JSONObject()
      .put("ok", running && granted)
      .put("running", running)
      .put("granted", granted)
      .put("message", message)
      .put("checkMode", "authorization_only")
      .toString()
  }

  @JavascriptInterface
  fun applySafeTweak(key: String): String {
    if (key != "animations") return JSONObject().put("ok", false).put("message", "Tweak não permitido.").toString()
    if (!isShizukuAuthorized()) return JSONObject().put("ok", false).put("message", "Inicie o Shizuku e conceda autorização ao SENSI.AI.").toString()
    if (context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE).contains("animations_backup")) return JSONObject().put("ok", false).put("message", "Animações Leves já foi aplicado. Restaure os valores anteriores antes de aplicar novamente, para não sobrescrever o backup.").toString()
    return try {
      val result = callSafeTweakService(1, null)
      val json = JSONObject(result)
      if (json.optBoolean("ok")) {
        val backup = json.optJSONObject("backup")
        if (backup != null) context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE).edit().putString("animations_backup", backup.toString()).apply()
      }
      result
    } catch (error: Throwable) {
      JSONObject().put("ok", false).put("message", "Não foi possível executar via Shizuku: ${error.message ?: "erro desconhecido"}").toString()
    }
  }


  @JavascriptInterface
  fun applyMassinhaTweak(version: String, packageName: String): String {
    if (version != "v1" && version != "v2") return JSONObject().put("ok", false).put("message", "Variante inválida.").toString()
    if (packageName != "com.dts.freefireth" && packageName != "com.dts.freefiremax") return JSONObject().put("ok", false).put("message", "Pacote não permitido.").toString()
    if (!isShizukuAuthorized()) return JSONObject().put("ok", false).put("message", "Shizuku não está ativo ou autorizado.").toString()
    val prefs = context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE)
    if (prefs.contains("massinha_backup")) return JSONObject().put("ok", false).put("message", "Restaure o backup anterior antes de aplicar outro perfil.").toString()
    return try {
      val result = callSafeTweakService(3, JSONObject().put("version", version).put("package", packageName).toString())
      val json = JSONObject(result)
      if (json.optBoolean("ok")) json.optJSONObject("backup")?.let { prefs.edit().putString("massinha_backup", it.toString()).apply() }
      result
    } catch (error: Throwable) { JSONObject().put("ok", false).put("message", "Falha: " + (error.message ?: "erro desconhecido")).toString() }
  }

  @JavascriptInterface
  fun restoreMassinhaTweak(): String {
    if (!isShizukuAuthorized()) return JSONObject().put("ok", false).put("message", "Shizuku não autorizado.").toString()
    val prefs = context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE)
    val backup = prefs.getString("massinha_backup", null) ?: return JSONObject().put("ok", false).put("message", "Backup Massinha não encontrado.").toString()
    return try {
      val result = callSafeTweakService(4, backup)
      if (JSONObject(result).optBoolean("ok")) prefs.edit().remove("massinha_backup").apply()
      result
    } catch (error: Throwable) { JSONObject().put("ok", false).put("message", "Falha ao restaurar: " + (error.message ?: "erro desconhecido")).toString() }
  }

  @JavascriptInterface
  fun restoreSafeTweak(key: String): String {
    if (key != "animations") return JSONObject().put("ok", false).put("message", "Restauração não permitida.").toString()
    if (!isShizukuAuthorized()) return JSONObject().put("ok", false).put("message", "Shizuku não está ativo ou autorizado.").toString()
    val backup = context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE).getString("animations_backup", null)
      ?: return JSONObject().put("ok", false).put("message", "Não há backup de Animações Leves neste aparelho.").toString()
    return try {
      val result = callSafeTweakService(2, backup)
      val json = JSONObject(result)
      if (json.optBoolean("ok")) context.getSharedPreferences("sensi_safe_tweaks", Context.MODE_PRIVATE).edit().remove("animations_backup").apply()
      result
    } catch (error: Throwable) {
      JSONObject().put("ok", false).put("message", "Falha ao restaurar: ${error.message ?: "erro desconhecido"}").toString()
    }
  }

  private fun isShizukuAuthorized(): Boolean {
    return try { Shizuku.pingBinder() && Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED } catch (_: Throwable) { false }
  }

  private fun callSafeTweakService(code: Int, payload: String?): String {
    val args = Shizuku.UserServiceArgs(ComponentName(context, SafeTweakUserService::class.java))
      .daemon(false)
      .processNameSuffix("safe_tweaks")
      .tag("sensi_safe_tweaks")
      .version(1)
    val latch = CountDownLatch(1)
    var remote: IBinder? = null
    val connection = object : ServiceConnection {
      override fun onServiceConnected(name: ComponentName?, service: IBinder?) { remote = service; latch.countDown() }
      override fun onServiceDisconnected(name: ComponentName?) { remote = null; latch.countDown() }
    }
    try {
      Shizuku.bindUserService(args, connection)
      if (!latch.await(10, TimeUnit.SECONDS)) throw IllegalStateException("Tempo esgotado ao conectar ao serviço Shizuku.")
      val binder = remote ?: throw IllegalStateException("Serviço Shizuku indisponível.")
      val data = Parcel.obtain()
      val reply = Parcel.obtain()
      try {
        data.writeInterfaceToken(SafeTweakUserService.DESCRIPTOR)
        if (payload != null) data.writeString(payload)
        if (!binder.transact(code, data, reply, 0)) throw RemoteException("Operação não suportada pelo serviço.")
        reply.readException()
        return reply.readString() ?: JSONObject().put("ok", false).put("message", "Resposta vazia do serviço.").toString()
      } finally {
        data.recycle()
        reply.recycle()
      }
    } finally {
      try { Shizuku.unbindUserService(args, connection, true) } catch (_: Throwable) { }
    }
  }

  @JavascriptInterface
  fun openTweakSettings(key: String): Boolean {
    val intent = when (key) {
      "battery" -> Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS)
      "network" -> Intent(Settings.ACTION_WIFI_SETTINGS)
      "display" -> Intent(Settings.ACTION_DISPLAY_SETTINGS)
      "storage" -> Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS)
      "background" -> Intent(Settings.ACTION_APPLICATION_SETTINGS)
      "sound" -> Intent(Settings.ACTION_SOUND_SETTINGS)
      "privacy" -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.parse("package:${context.packageName}")
      }
      "notifications" -> if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
          putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        }
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.parse("package:${context.packageName}")
        }
      }
      "updates" -> Intent(Settings.ACTION_SETTINGS)
      "accessibility" -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      else -> return false
    }
    return try {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      true
    } catch (_: Throwable) {
      false
    }
  }

  @JavascriptInterface
  fun openFreeFire(edition: String): String {
    val packages = when (edition) {
      "freefiremax" -> listOf("com.dts.freefiremax", "com.dts.freefireth")
      else -> listOf("com.dts.freefireth", "com.dts.freefiremax")
    }
    for (packageName in packages) {
      val launchIntent = try { context.packageManager.getLaunchIntentForPackage(packageName) } catch (_: Throwable) { null }
      if (launchIntent != null) {
        return try {
          launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          context.startActivity(launchIntent)
          "opened"
        } catch (_: Throwable) { "failed" }
      }
    }
    return "not_installed"
  }

  @JavascriptInterface
  fun copyText(text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    clipboard?.setPrimaryClip(ClipData.newPlainText("SENSI.AI", text))
  }
}

private tailrec fun Context.findComponentActivity(): ComponentActivity? = when (this) {
  is ComponentActivity -> this
  is ContextWrapper -> baseContext.findComponentActivity()
  else -> null
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SensiOfflineWebHost() {
  var webViewRef by remember { mutableStateOf<WebView?>(null) }
  var canGoBack by remember { mutableStateOf(false) }

  BackHandler(enabled = canGoBack) {
    webViewRef?.goBack()
  }

  Box(
    modifier =
      Modifier
        .fillMaxSize()
        .background(MaterialTheme.colorScheme.background)
        .windowInsetsPadding(WindowInsets.safeDrawing)
  ) {
    AndroidView(
      modifier = Modifier.fillMaxSize().testTag("sensi_webview"),
      factory = { context ->
        WebView(context).apply {
          layoutParams =
            ViewGroup.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT,
            )
          setBackgroundColor(AndroidColor.parseColor("#070709"))
          overScrollMode = WebView.OVER_SCROLL_NEVER

          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            blockNetworkLoads = true
            cacheMode = WebSettings.LOAD_NO_CACHE
          }

          val hostActivity = context.findComponentActivity() ?: error("Activity Android indisponível para o Shizuku.")
          addJavascriptInterface(AndroidClipboardBridge(hostActivity), "AndroidBridge")

          webChromeClient = WebChromeClient()
          webViewClient =
            object : WebViewClient() {
              override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?,
              ): Boolean {
                val url = request?.url?.toString().orEmpty()
                return !url.startsWith("file:///android_asset/")
              }

              override fun onPageFinished(view: WebView?, url: String?) {
                canGoBack = view?.canGoBack() == true
              }
            }

          loadUrl("file:///android_asset/web/index.html")
          webViewRef = this
        }
      },
      update = { webView ->
        webViewRef = webView
        canGoBack = webView.canGoBack()
      },
    )
  }
}
