package com.harryharrison.militaryhistoryapp.credentialmanager

import android.app.Activity
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPasswordOption
import androidx.credentials.PasswordCredential
import com.facebook.react.bridge.*
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CredentialManagerModule(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = "CredentialManager"

  @ReactMethod
  fun getCredential(options: ReadableMap, promise: Promise) {
    val activity: Activity = getCurrentActivity() ?: return promise.reject("NO_ACTIVITY", "No activity")
    val webClientId = options.getString("googleWebClientId")
      ?: return promise.reject("BAD_ARGS", "googleWebClientId required")

    val google = GetGoogleIdOption.Builder()
      .setServerClientId(webClientId)
      .setFilterByAuthorizedAccounts(false)
      .build()
    val password = GetPasswordOption()

    val request = GetCredentialRequest.Builder()
      .addCredentialOption(google)
      .addCredentialOption(password)
      .build()

    val cm = CredentialManager.create(activity)
    CoroutineScope(Dispatchers.Main).launch {
      try {
        val response = cm.getCredential(activity, request)
        when (val cred = response.credential) {
          is GoogleIdTokenCredential -> {
            val out = Arguments.createMap()
            out.putString("type", "google")
            out.putString("idToken", cred.idToken)
            promise.resolve(out)
          }
          is PasswordCredential -> {
            val out = Arguments.createMap()
            out.putString("type", "password")
            out.putString("username", cred.id)
            out.putString("password", cred.password)
            promise.resolve(out)
          }
          else -> promise.reject("UNSUPPORTED", "Unsupported credential type")
        }
      } catch (e: Exception) {
        promise.reject("CM_ERROR", e.message, e)
      }
    }
  }
}
