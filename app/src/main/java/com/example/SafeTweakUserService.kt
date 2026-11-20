package com.example

import android.os.Binder
import android.os.IBinder
import android.os.Parcel
import org.json.JSONObject

/**
 * Shizuku UserService with a deliberately tiny allowlist.
 * It can only adjust the three Android UI animation scales and restore
 * the exact previous values supplied by the app's locally stored backup.
 */
class SafeTweakUserService : Binder() {
  companion object {
    const val DESCRIPTOR = "com.example.SENSIAI_SAFE_TWEAKS"
    private const val APPLY_ANIMATIONS = 1
    private const val RESTORE_ANIMATIONS = 2
    private val settingKeys = listOf(
      "window_animation_scale",
      "transition_animation_scale",
      "animator_duration_scale"
    )
    private const val SETTINGS_BIN = "/system/bin/settings"
  }

  override fun onTransact(code: Int, data: Parcel, reply: Parcel?, flags: Int): Boolean {
    if (code != APPLY_ANIMATIONS && code != RESTORE_ANIMATIONS) return super.onTransact(code, data, reply, flags)
    data.enforceInterface(DESCRIPTOR)
    val result = try {
      when (code) {
        APPLY_ANIMATIONS -> applyAnimations()
        RESTORE_ANIMATIONS -> restoreAnimations(data.readString().orEmpty())
        else -> JSONObject().put("ok", false).put("message", "Operação não permitida.")
      }
    } catch (error: Throwable) {
      JSONObject().put("ok", false).put("message", error.message ?: "Falha no serviço Shizuku.")
    }
    reply?.writeNoException()
    reply?.writeString(result.toString())
    return true
  }

  private fun applyAnimations(): JSONObject {
    val backup = JSONObject()
    settingKeys.forEach { key ->
      val (exit, value) = runSettings("get", "global", key)
      if (exit != 0) throw IllegalStateException("Não foi possível ler $key: $value")
      backup.put(key, value.trim().ifBlank { "null" })
    }

    val changed = mutableListOf<String>()
    try {
      settingKeys.forEach { key ->
        val (exit, output) = runSettings("put", "global", key, "0.5")
        if (exit != 0) throw IllegalStateException("Android recusou $key: $output")
        changed.add(key)
      }
    } catch (error: Throwable) {
      settingKeys.forEach { key ->
        val previous = backup.optString(key, "null")
        restoreOne(key, previous)
      }
      throw error
    }

    return JSONObject()
      .put("ok", true)
      .put("message", "As três escalas de animação foram definidas para 0,5x.")
      .put("backup", backup)
  }

  private fun restoreAnimations(serializedBackup: String): JSONObject {
    val backup = JSONObject(serializedBackup)
    settingKeys.forEach { key ->
      if (!backup.has(key)) throw IllegalArgumentException("Backup incompleto. Restauração cancelada.")
      val value = backup.getString(key)
      if (value != "null" && !value.matches(Regex("[0-9]+(?:\\.[0-9]+)?"))) {
        throw IllegalArgumentException("Valor de backup inválido. Restauração cancelada.")
      }
    }
    settingKeys.forEach { key -> restoreOne(key, backup.getString(key)) }
    return JSONObject().put("ok", true).put("message", "Valores originais das três animações restaurados.")
  }

  private fun restoreOne(key: String, value: String) {
    val result = if (value == "null") {
      runSettings("delete", "global", key)
    } else {
      runSettings("put", "global", key, value)
    }
    if (result.first != 0) throw IllegalStateException("Falha ao restaurar $key: ${result.second}")
  }

  private fun runSettings(vararg arguments: String): Pair<Int, String> {
    val process = ProcessBuilder(listOf(SETTINGS_BIN) + arguments)
      .redirectErrorStream(true)
      .start()
    val output = process.inputStream.bufferedReader().use { it.readText() }.trim()
    val exitCode = process.waitFor()
    return exitCode to output
  }
}
