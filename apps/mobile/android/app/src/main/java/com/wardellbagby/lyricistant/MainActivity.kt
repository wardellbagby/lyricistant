package com.wardellbagby.lyricistant

import android.os.Bundle
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebSettingsCompat.DARK_STRATEGY_WEB_THEME_DARKENING_ONLY
import androidx.webkit.WebSettingsCompat.FORCE_DARK_ON
import androidx.webkit.WebViewFeature
import androidx.webkit.WebViewFeature.FORCE_DARK
import androidx.webkit.WebViewFeature.FORCE_DARK_STRATEGY
import com.getcapacitor.BridgeActivity
import com.getcapacitor.CapacitorWebView
import com.wardellbagby.lyricistant.plugins.FilesPlugin

class MainActivity : BridgeActivity() {
  private lateinit var webView: CapacitorWebView
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    registerPlugin(FilesPlugin::class.java)
  }

  override fun onStart() {
    super.onStart()
    webView = findViewById(R.id.webview)
    if (WebViewFeature.isFeatureSupported(FORCE_DARK)) {
      WebSettingsCompat.setForceDark(webView.settings, FORCE_DARK_ON)
      if (WebViewFeature.isFeatureSupported(FORCE_DARK_STRATEGY)) {
        WebSettingsCompat.setForceDarkStrategy(
          webView.settings,
          DARK_STRATEGY_WEB_THEME_DARKENING_ONLY
        )
      }
    }
  }
}