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
@OptIn(ExperimentalUnsignedTypes::class)
class FilesPlugin : Plugin() {
  @PluginMethod
  fun openFile(call: PluginCall) {
    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "*/*"
      putExtra(Intent.EXTRA_TITLE, "Lyrics.lyrics")
    }

    startActivityForResult(call, intent, "openFileResult")
  }

  @PluginMethod
  fun saveFile(call: PluginCall) {
    val filePath = call.getString("path")
    if (!filePath.isNullOrBlank()) {
      val uri = Uri.parse(filePath)
      call.attemptFileSave(uri)
    } else {
      val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
        addCategory(Intent.CATEGORY_OPENABLE)
        type = "*/*"
        putExtra(Intent.EXTRA_TITLE, "Lyrics.lyrics")
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
      val data = uri.read()
      call.resolve(PlatformFile(uri.toString(), uri.displayName, data))
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
        val data = getArray("data")?.toList<Int>()?.map {
          it.toUByte()
        }?.toUByteArray() ?: kotlin.error("Received no data to write?")

        write(data)
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
        val displayNameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
        it.getString(displayNameIndex)
      }
    }

  private fun Uri.persist() {
    context.contentResolver.run {
      takePersistableUriPermission(
        this@persist, FLAG_GRANT_READ_URI_PERMISSION or FLAG_GRANT_WRITE_URI_PERMISSION
      )
    }
  }

  private fun Uri.write(data: UByteArray) {
    context.contentResolver.run {
      openOutputStream(this@write)?.use {
        it.write(data.asByteArray())
      }
    }
  }

  private fun Uri.read(): UByteArray {
    return context.contentResolver.run {
      openInputStream(this@read)?.use {
        it.readBytes().asUByteArray()
      } ?: error("Failed to read from Uri: ${this@read}")
    }
  }

  @Suppress("FunctionName")
  private fun FileMetadata(
    path: String?,
    name: String?
  ) = JSObject().apply {
    put("path", path)
    put("name", name)
  }

  @Suppress("FunctionName")
  private fun PlatformFile(
    path: String?,
    name: String?,
    data: UByteArray
  ): JSObject {
    val dataArray = data.map { it.toShort() }.toShortArray()
    return FileMetadata(path, name).apply {
      put("data", JSObject.wrap(dataArray))
    }
  }
}