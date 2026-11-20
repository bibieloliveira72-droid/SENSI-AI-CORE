package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val SensiDarkColorScheme =
  darkColorScheme(
    primary = CrimsonRed,
    onPrimary = TextLight,
    secondary = BrightCrimson,
    onSecondary = TextLight,
    background = VoidBlack,
    onBackground = TextLight,
    surface = CarbonSurface,
    onSurface = TextLight,
    surfaceVariant = ElevatedCarbon,
    onSurfaceVariant = TextMuted,
  )

@Composable
fun MyApplicationTheme(content: @Composable () -> Unit) {
  MaterialTheme(
    colorScheme = SensiDarkColorScheme,
    typography = Typography,
    content = content,
  )
}
