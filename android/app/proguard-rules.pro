# ==============================================================================
# D1 HABIT TRACKER - PRODUCTION PROGUARD & R8 OBFUSCATION RULES
# ==============================================================================

# 1. Capacitor Core & Plugins (Preserve Bridge & Plugin Interfaces)
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public *;
}
-keep public class * extends com.getcapacitor.BridgeActivity
-keep class com.getcapacitor.Bridge
-keep class com.getcapacitor.PluginCall { *; }
-keep class com.getcapacitor.JSObject { *; }
-keep class com.getcapacitor.JSArray { *; }

# 2. WebView JavaScript Interface & Annotations (CRITICAL for native-web bridge)
-keepattributes JavascriptInterface
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 3. AndroidX Core, Splashscreen & Components
-keep class androidx.core.splashscreen.** { *; }
-keep class androidx.appcompat.** { *; }
-keep class androidx.coordinatorlayout.** { *; }

# 4. Firebase & Google Services
-dontwarn com.google.firebase.**
-keep class com.google.firebase.** { *; }
-dontwarn com.google.android.gms.**
-keep class com.google.android.gms.** { *; }

# 5. Suppress warnings for optional 3rd-party auth SDKs in @capacitor-firebase/authentication
-dontwarn com.facebook.**
-dontwarn com.twitter.**
-dontwarn com.google.android.play.core.**
-dontwarn io.capawesome.capacitorjs.plugins.firebase.authentication.**

# 6. Local Notifications & Device Plugins
-keep class com.capacitorjs.plugins.localnotifications.** { *; }

# 7. Retain line numbers for crash diagnostics while renaming source files
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# 8. D1 Custom Plugins, Receivers & Habit Drawables
-keep class com.definite.habittracker.** { *; }
-keepclassmembers class com.definite.habittracker.** { *; }
-keepclassmembers class com.definite.habittracker.R$drawable {
    public static <fields>;
}
