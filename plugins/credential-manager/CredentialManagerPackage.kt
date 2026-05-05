package com.harryharrison.militaryhistoryapp.credentialmanager

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CredentialManagerPackage : ReactPackage {
  override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
    listOf(CredentialManagerModule(ctx))
  override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
