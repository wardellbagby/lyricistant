package com.wardellbagby.lyricistant.plugins

import android.content.Intent
import android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION
import android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "Files")
class FilesPlugin : Plugin() {
  @PluginMethod
  fun openFile(call: PluginCall) {
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "text/plain"
      putExtra(Intent.EXTRA_TITLE, "Lyrics.txt")
    }

    startActivityForResult(call, intent, "openFileResult")
  }

  @PluginMethod
  fun saveFile(call: PluginCall) {
    val filePath = call.getString("filePath");
    if (!filePath.isNullOrBlank()) {
      val uri = Uri.parse(filePath)
      call.attemptFileSave(uri)
    } else {
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "text/plain"
        putExtra(Intent.EXTRA_TITLE, "Lyrics.txt")
      }

      startActivityForResult(call, intent, "saveFileResult")
    }
  }

  @ActivityCallback
  private fun openFileResult(
    call: PluginCall?,
    result: ActivityResult
  ) {
    if (call == null) {
      return
    }
    val uri = result.data?.data
    if (uri == null) {
      call.resolve()
      return
    }

    runCatching {
      uri.persist()
      call.resolve(FileData(uri.toString(), uri.displayName, uri.read()))
    }
  }

  @ActivityCallback
  private fun saveFileResult(
    call: PluginCall?,
    result: ActivityResult
  ) {
    if (call == null) {
      return
    }
    val uri = result.data?.data
    if (uri == null) {
      call.resolve()
      return
    }

    call.attemptFileSave(uri)
  }

  private fun PluginCall.attemptFileSave(uri: Uri) {
    runCatching {
      uri.run {
        persist()
        write(getString("data") ?: kotlin.error("Received no data to write?"))
        displayName
      }
    }
      .onSuccess { name ->
        resolve(FileMetadata(uri.toString(), name))
      }
      .onFailure {
        reject(it.message)
      }
  }

  private val Uri.displayName: String?
    get() = context.contentResolver.query(
      this, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null
    )?.use {
      if (!it.moveToFirst()) {
        null
      } else {
        it.getString(it.getColumnIndex(OpenableColumns.DISPLAY_NAME))
      }
    }

  private fun Uri.persist() {
    context.contentResolver.run {
      takePersistableUriPermission(
        this@persist, FLAG_GRANT_READ_URI_PERMISSION or FLAG_GRANT_WRITE_URI_PERMISSION
      )
    }
  }

  private fun Uri.write(data: String) {
    context.contentResolver.run {
      openOutputStream(this@write)?.bufferedWriter()?.use {
        it.write(data)
      }
    }
  }

  private fun Uri.read(): String {
    return context.contentResolver.run {
      openInputStream(this@read)?.bufferedReader()?.use {
        it.readText()
      } ?: error("Failed to read from Uri: ${this@read}")
    }
  }

  @Suppress("FunctionName")
  private fun FileMetadata(
    filePath: String?,
    name: String?
  ) = JSObject().apply {
    put("filePath", filePath)
    put("name", name)
  }

  @Suppress("FunctionName")
  private fun FileData(
    filePath: String?,
    name: String?,
    data: String
  ) = FileMetadata(filePath, name).apply {
    put("data", data)
  }
}