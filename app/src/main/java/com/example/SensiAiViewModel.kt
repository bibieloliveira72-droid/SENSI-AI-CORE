package com.example

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.content
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

private const val TAG = "SensiAiViewModel"

sealed interface SensiAiUiState {
  data object Idle : SensiAiUiState

  data object Loading : SensiAiUiState

  data class Success(val callbackId: String, val payloadJson: String) : SensiAiUiState

  data class Error(val callbackId: String, val message: String) : SensiAiUiState
}

class SensiAiViewModel : ViewModel() {
  private val sensiSchema =
    Schema.obj(
      properties =
        mapOf(
          "General" to Schema.integer(description = "Sensibilidade Geral (0 a 200)"),
          "Red Dot" to Schema.integer(description = "Sensibilidade Ponto Vermelho / Red Dot (0 a 200)"),
          "2x" to Schema.integer(description = "Sensibilidade Mira 2x (0 a 200)"),
          "4x" to Schema.integer(description = "Sensibilidade Mira 4x (0 a 200)"),
          "AWM" to Schema.integer(description = "Sensibilidade Mira AWM / Sniper (0 a 200)"),
          "Olhadinha" to Schema.integer(description = "Sensibilidade Olhadinha / Câmera livre (0 a 200)"),
          "observacoes" to
            Schema.string(description = "Dica breve e prática de calibração em português"),
        )
    )

  private val model by lazy {
    Firebase.ai.generativeModel(
      modelName = "gemini-3.8-flash",
      generationConfig =
        generationConfig {
          temperature = 0.35f
          responseMimeType = "application/json"
          responseSchema = sensiSchema
        },
      systemInstruction =
        content {
          text(
            "Você é o motor técnico do SENSI.AI, especialista em calibração de sensibilidade mobile para jogos de tiro em terceira pessoa. Nunca prometa resultados garantidos; forneça pontos de partida coerentes com DPI, Hz, hardware e estilo do jogador."
          )
        },
    )
  }

  private val _uiState = MutableStateFlow<SensiAiUiState>(SensiAiUiState.Idle)
  val uiState: StateFlow<SensiAiUiState> = _uiState.asStateFlow()

  fun generateSensitivity(requestJson: String, callbackId: String) {
    viewModelScope.launch {
      _uiState.value = SensiAiUiState.Loading
      try {
        val req = JSONObject(requestJson)
        val marca = req.optString("marca").trim()
        val modelo = req.optString("modelo").trim()
        val ram = req.optInt("ram", -1)
        val taxaAtualizacao = req.optInt("taxaAtualizacao", -1)
        val dpi = req.optInt("dpi", -1)
        val estiloJogo = req.optString("estiloJogo").trim()
        val preferenciaMira = req.optString("preferenciaMira").trim()

        if (
          marca.length < 2 ||
            modelo.isEmpty() ||
            ram !in 1..64 ||
            taxaAtualizacao !in 30..240 ||
            dpi !in 100..2000 ||
            estiloJogo.length < 2 ||
            preferenciaMira.length < 2
        ) {
          _uiState.value =
            SensiAiUiState.Error(
              callbackId = callbackId,
              message = "Dados inválidos para gerar sensibilidade. Verifique os campos informados.",
            )
          return@launch
        }

        val prompt =
          """
          Calcule uma configuração inicial recomendada de sensibilidade mobile (escala 0 a 200, padrão atual competitivo) para o seguinte perfil:
          - Marca: $marca
          - Modelo: $modelo
          - Memória RAM: $ram GB
          - Taxa de atualização da tela: $taxaAtualizacao Hz
          - DPI configurada: $dpi
          - Estilo de jogo: $estiloJogo
          - Preferência de mira: $preferenciaMira

          Considere o impacto real de DPI alta/baixa, taxa de amostragem/Hz da tela e estabilidade de quadros pela RAM.
          Retorne exclusivamente JSON válido seguindo o schema solicitado, com números inteiros entre 0 e 200 e uma observação objetiva em português indicando que é um ponto de partida para ajuste fino.
          """.trimIndent()

        val response = withTimeout(60_000L) { model.generateContent(prompt) }
        val jsonText =
          response.text?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("O modelo Gemini retornou uma resposta vazia.")

        val parsed = JSONObject(jsonText)
        val keys = listOf("General", "Red Dot", "2x", "4x", "AWM", "Olhadinha")
        val normalized = JSONObject()
        for (key in keys) {
          if (!parsed.has(key)) {
            throw IllegalStateException("Campo obrigatório ausente na resposta: $key")
          }
          val value = parsed.getInt(key).coerceIn(0, 200)
          normalized.put(key, value)
        }

        val obs =
          parsed.optString("observacoes").trim().ifEmpty {
            "Ajuste em incrementos de 2 a 5 pontos no modo treinamento até estabilizar a puxada."
          }
        normalized.put("observacoes", obs)
        normalized.put(
          "aviso",
          "Sugestão inicial gerada por IA com base no seu dispositivo e estilo. Não são valores garantidos; faça ajustes finos conforme película, toque e memória muscular.",
        )

        _uiState.value = SensiAiUiState.Success(callbackId, normalized.toString())
      } catch (e: TimeoutCancellationException) {
        Log.e(TAG, "Firebase AI generation timed out", e)
        _uiState.value =
          SensiAiUiState.Error(
            callbackId = callbackId,
            message = "Tempo limite de 60 segundos excedido ao chamar o Gemini.",
          )
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        Log.e(TAG, "Firebase AI generation failed", e)
        _uiState.value =
          SensiAiUiState.Error(
            callbackId = callbackId,
            message = e.localizedMessage ?: "Falha ao gerar sensibilidade via Firebase AI.",
          )
      }
    }
  }

  fun markHandled() {
    _uiState.value = SensiAiUiState.Idle
  }
}
