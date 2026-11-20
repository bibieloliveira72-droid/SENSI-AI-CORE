package com.example

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
import java.io.BufferedReader
import java.io.InputStreamReader
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
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

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
}

private class AndroidClipboardBridge(private val context: Context) {
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
  fun requestShizukuPermission() {
    if (try { Shizuku.pingBinder() } catch (_: Throwable) { false }) {
      try { Shizuku.requestPermission(2407) } catch (_: Throwable) { }
    }
  }


  @JavascriptInterface
  fun runShizukuDiagnostics(): String {
    val running = try { Shizuku.pingBinder() } catch (_: Throwable) { false }
    if (!running) return JSONObject().put("ok", false).put("message", "Shizuku não está ativo. Inicie o serviço e tente novamente.").toString()
    val granted = try { Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED } catch (_: Throwable) { false }
    if (!granted) return JSONObject().put("ok", false).put("message", "Autorização Shizuku ainda não concedida.").toString()

    fun readOnly(command: Array<String>): String {
      val process = Shizuku.newProcess(command, null, null)
      val output = process.inputStream.bufferedReader().use { it.readText() }.trim()
      val error = process.errorStream.bufferedReader().use { it.readText() }.trim()
      val exit = process.waitFor()
      return if (exit == 0) output.take(500) else (error.ifBlank { "Comando indisponível (código $exit)." }).take(300)
    }

    return try {
      val result = JSONObject()
      result.put("ok", true)
      result.put("identity", readOnly(arrayOf("/system/bin/id")))
      result.put("androidRelease", readOnly(arrayOf("/system/bin/getprop", "ro.build.version.release")))
      result.put("screenSize", readOnly(arrayOf("/system/bin/wm", "size")))
      result.put("screenDensity", readOnly(arrayOf("/system/bin/wm", "density")))
      result.put("message", "Acesso Shizuku confirmado. Foram executadas somente consultas de leitura.")
      result.toString()
    } catch (error: Throwable) {
      JSONObject().put("ok", false).put("message", "Falha no teste Shizuku: ${error.message ?: "erro desconhecido"}").toString()
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
      "notifications" -> Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
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

          addJavascriptInterface(AndroidClipboardBridge(context.applicationContext), "AndroidBridge")

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
