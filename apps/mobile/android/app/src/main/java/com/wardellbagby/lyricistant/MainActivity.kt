package com.wardellbagby.lyricistant

import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import com.getcapacitor.BridgeActivity
import com.getcapacitor.JSObject
import com.wardellbagby.lyricistant.plugins.FilesPlugin

class MainActivity : BridgeActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    registerPlugin(FilesPlugin::class.java)
  }

  override fun onStart() {
    super.onStart()
    bridge.webView.addJavascriptInterface(NativeThemeProvider(), "nativeThemeProvider")
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    updateWebViewNativeTheme()
  }

  private fun updateWebViewNativeTheme() {
    val isDarkTheme = if (isDarkThemeEnabled()) "true" else "false";

    bridge.eval(
      "window.onNativeThemeChanged({DARK}, {PALETTE})"
        .replace("{DARK}", isDarkTheme)
        .replace("{PALETTE}", getSystemPalette()),
      null
    )
  }

  private fun isDarkThemeEnabled() = when (resources.configuration.uiMode and
    Configuration.UI_MODE_NIGHT_MASK) {
    Configuration.UI_MODE_NIGHT_NO -> false
    else -> true
  }

  private fun getSystemPalette(): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return "{}"
    }

    val palette = if (isDarkThemeEnabled()) {
      mapOf(
        "primary" to getColor(android.R.color.system_accent1_200).toHex(),
        "background" to getColor(android.R.color.system_neutral1_900).toHex(),
        "surface" to getColor(android.R.color.system_neutral2_800).toHex()
      )
    } else {
      mapOf(
        "primary" to getColor(android.R.color.system_accent1_700).toHex(),
        "background" to getColor(android.R.color.system_neutral1_100).toHex(),
        "surface" to getColor(android.R.color.system_neutral1_200).toHex()
      )
    }
      return JSObject.wrap(palette)!!.toString()
  }

  private inner class NativeThemeProvider {
    @JavascriptInterface
    fun isDarkTheme() = isDarkThemeEnabled()

    @JavascriptInterface
    fun getPalette() = getSystemPalette()
  }

  private fun Int.toHex() = "#${Integer.toHexString(this).substring(2)}"
}