package com.example

import android.content.Context
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import org.json.JSONObject

private const val PREFS = "voidstrap_mobile"
private const val PROFILE_KEY = "flags_json"
private const val DEFAULT_FLAGS = """{
  "DFIntTaskSchedulerTargetFps": 60
}"""

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { VoidstrapApp() }
  }
}

@Composable
private fun VoidstrapApp() {
  val context = LocalContext.current
  val prefs = remember { context.getSharedPreferences(PREFS, Context.MODE_PRIVATE) }
  var flags by remember { mutableStateOf(prefs.getString(PROFILE_KEY, DEFAULT_FLAGS) ?: DEFAULT_FLAGS) }
  var validation by remember { mutableStateOf("Edite seu perfil de FastFlags.") }
  var valid by remember { mutableStateOf(true) }

  MaterialTheme(colorScheme = darkColorScheme(
    primary = Color(0xFFB7F36B), background = Color(0xFF090B0A),
    surface = Color(0xFF151A16), onPrimary = Color(0xFF10140D),
    onBackground = Color(0xFFEAF0E8), onSurface = Color(0xFFEAF0E8)
  )) {
    Surface(Modifier.fillMaxSize(), color = Color(0xFF090B0A)) {
      Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
      ) {
        Text("VOIDSTRAP", style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black, color = Color(0xFFB7F36B))
        Text("MOBILE BOOTSTRAPPER", style = MaterialTheme.typography.labelLarge, color = Color(0xFF9AA69A))
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF151A16))) {
          Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Seu Roblox, suas configurações", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Base Android independente, preparada para perfis de FastFlags e integração com Root/Shizuku.")
          }
        }
        Text("PERFIL DE FASTFLAGS", style = MaterialTheme.typography.labelLarge, color = Color(0xFFB7F36B))
        OutlinedTextField(
          value = flags,
          onValueChange = { flags = it; validation = "Alterações ainda não validadas."; valid = false },
          modifier = Modifier.fillMaxWidth().height(300.dp),
          label = { Text("JSON de FastFlags") },
          minLines = 10
        )
        Text(validation, color = if (valid) Color(0xFFB7F36B) else Color(0xFFFFC36B))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
          Button(onClick = {
            try {
              val json = JSONObject(flags)
              require(json.length() > 0) { "O objeto JSON está vazio." }
              val keys = json.keys()
              while (keys.hasNext()) {
                val key = keys.next()
                require(key.isNotBlank()) { "Existe uma chave vazia." }
                val value = json.get(key)
                require(value !is JSONObject && value !is org.json.JSONArray && value !== JSONObject.NULL) {
                  "A flag '$key' precisa ter um valor simples (texto, número ou booleano)."
                }
              }
              prefs.edit().putString(PROFILE_KEY, json.toString(2)).apply()
              flags = json.toString(2)
              validation = "JSON válido. ${json.length()} FastFlag(s) no perfil."
              valid = true
            } catch (error: Exception) {
              validation = "JSON inválido: ${error.message ?: "verifique a estrutura"}"
              valid = false
            }
          }) { Text("Validar e salvar") }
          OutlinedButton(onClick = {
            flags = prefs.getString(PROFILE_KEY, DEFAULT_FLAGS) ?: DEFAULT_FLAGS
            validation = "Perfil salvo carregado."
            valid = true
          }) { Text("Recarregar") }
        }
        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF151A16))) {
          Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("MÉTODO DE ACESSO", color = Color(0xFFB7F36B), fontWeight = FontWeight.Bold)
            Text("Root: integração pendente")
            Text("Shizuku: integração pendente")
            Text("Nenhum comando é executado sem autorização explícita.")
          }
        }
        Button(onClick = {
          val launch = context.packageManager.getLaunchIntentForPackage("com.roblox.client")
          if (launch != null) context.startActivity(launch)
          else Toast.makeText(context, "Roblox não encontrado neste aparelho.", Toast.LENGTH_SHORT).show()
        }, modifier = Modifier.fillMaxWidth()) { Text("Abrir Roblox") }
        OutlinedButton(onClick = {}, enabled = false, modifier = Modifier.fillMaxWidth()) {
          Text("Aplicar FastFlags (integração em desenvolvimento)")
        }
        Text("VOIDSTRAP MOBILE • build de desenvolvimento", color = Color(0xFF7F8A80), style = MaterialTheme.typography.labelSmall)
      }
    }
  }
}
