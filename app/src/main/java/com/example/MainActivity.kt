package com.example

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color as AndroidColor
import android.os.Bundle
import android.os.Handler
import android.os.Looper
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.theme.MyApplicationTheme
import org.json.JSONObject

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Configure Firebase App Check with launch intent before any UI, ViewModels, or Firebase calls
    configureAppCheck(this, intent)

    val darkBar = AndroidColor.parseColor("#070709")
    enableEdgeToEdge(
      statusBarStyle = SystemBarStyle.dark(darkBar),
      navigationBarStyle = SystemBarStyle.dark(darkBar),
    )

    setContent {
      MyApplicationTheme {
        val sensiViewModel: SensiAiViewModel = viewModel()
        SensiWebHost(viewModel = sensiViewModel)
      }
    }
  }
}

private class AndroidSensiBridge(
  private val context: Context,
  private val onGenerateRequest: (requestJson: String, callbackId: String) -> Unit,
) {
  private val mainHandler = Handler(Looper.getMainLooper())

  @JavascriptInterface
  fun copyText(text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
    clipboard?.setPrimaryClip(ClipData.newPlainText("SENSI.AI", text))
  }

  @JavascriptInterface
  fun hasFirebaseAi(): Boolean = true

  @JavascriptInterface
  fun generateSensiWithFirebase(requestJson: String, callbackId: String) {
    mainHandler.post { onGenerateRequest(requestJson, callbackId) }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SensiWebHost(viewModel: SensiAiViewModel) {
  var webViewRef by remember { mutableStateOf<WebView?>(null) }
  var canGoBack by remember { mutableStateOf(false) }
  val uiState by viewModel.uiState.collectAsStateWithLifecycle()

  LaunchedEffect(uiState, webViewRef) {
    val webView = webViewRef ?: return@LaunchedEffect
    when (val state = uiState) {
      is SensiAiUiState.Success -> {
        val quotedId = JSONObject.quote(state.callbackId)
        val quotedPayload = JSONObject.quote(state.payloadJson)
        webView.evaluateJavascript(
          "window.__onFirebaseSensiResult && window.__onFirebaseSensiResult($quotedId, true, $quotedPayload);",
          null,
        )
        viewModel.markHandled()
      }
      is SensiAiUiState.Error -> {
        val quotedId = JSONObject.quote(state.callbackId)
        val quotedError = JSONObject.quote(state.message)
        webView.evaluateJavascript(
          "window.__onFirebaseSensiResult && window.__onFirebaseSensiResult($quotedId, false, $quotedError);",
          null,
        )
        viewModel.markHandled()
      }
      else -> Unit
    }
  }

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
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            cacheMode = WebSettings.LOAD_DEFAULT
          }

          addJavascriptInterface(
            AndroidSensiBridge(context.applicationContext) { requestJson, callbackId ->
              viewModel.generateSensitivity(requestJson, callbackId)
            },
            "AndroidBridge",
          )

          webChromeClient = WebChromeClient()
          webViewClient =
            object : WebViewClient() {
              override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?,
              ): Boolean {
                val url = request?.url?.toString().orEmpty()
                return !(url.startsWith("file:///android_asset/") || url.startsWith("about:"))
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
