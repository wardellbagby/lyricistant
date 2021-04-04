package com.wardellbagby.lyricistant

import android.content.res.Configuration
import android.os.Bundle
import android.webkit.JavascriptInterface
import com.getcapacitor.BridgeActivity
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
    bridge.eval("window.onNativeThemeChanged({DARK})".replace("{DARK}", isDarkTheme), null)
  }

  private fun isDarkThemeEnabled() = when (resources.configuration.uiMode and
    Configuration.UI_MODE_NIGHT_MASK) {
    Configuration.UI_MODE_NIGHT_NO -> false
    else -> true
  }

  private inner class NativeThemeProvider {
    @JavascriptInterface
    fun isDarkTheme() = isDarkThemeEnabled()
  }
}