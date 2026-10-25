# D1 HABIT TRACKER — PRODUCTION RELEASE CREDENTIALS & DEPLOYMENT GUIDE

> **IMPORTANT**: Yeh document aur isme diye gaye passwords / keystore files ko safe aur confidential rakhein. Google Play Store par future updates upload karne ke liye yahi Keystore life-long zaroori hoga.

---

## 1. ANDROID RELEASE KEYSTORE CREDENTIALS

| Field | Value |
| :--- | :--- |
| **Keystore File Name** | `d1-release-key.jks` |
| **Key Alias** | `d1key` |
| **Key Password** | `d1tracker@2026` |
| **Store Password** | `d1tracker@2026` |
| **Algorithm** | RSA 2048-bit (SHA256withRSA) |
| **Validity** | 10,000 Days (Valid until: March 12, 2054) |
| **Owner / Organization** | `CN=D1 Habit Tracker, OU=Definite Labs, O=Definite, L=Delhi, ST=DL, C=IN` |

### Keystore File Locations (Permanent Storage):
1. **Active Build Directory**: `G:\STITCH HABIT TRACKER\definite-habit-tracker\android\app\d1-release-key.jks`
2. **Dedicated Safe Backup**: `G:\STITCH HABIT TRACKER\Backups\Application\d1-release-key.jks`

---

## 2. CERTIFICATE FINGERPRINTS (FIREBASE & GOOGLE SIGN-IN)

Agar Google Sign-In ya Firebase App Check ke liye SHA fingerprints maange jayein:

* **SHA-1 Fingerprint**:
  ```text
  3A:41:7B:79:3D:5B:DC:D0:C4:60:5B:B0:41:DB:D5:35:B8:51:44:2A
  ```

* **SHA-256 Fingerprint**:
  ```text
  BB:87:F8:42:11:6A:22:B7:95:02:17:CC:9D:90:71:3B:7D:22:86:6E:E9:84:7E:C9:AC:2F:2F:96:7B:4D:6B:63
  ```

> [!TIP]
> **Firebase Console Setup**:
> Firebase Console -> Project Settings -> **Your apps** -> **Android App (`com.definite.habittracker`)** -> **Add fingerprint** par click karke upar diya gaya **SHA-1** aur **SHA-256** add kar dein. Isse release APK/AAB par Google Sign-In 100% smoothly authorize ho jayega.

---

## 3. READY-TO-DEPLOY BUILD ARTIFACTS

### A. Google Play Console Bundle (.aab)
* **File Name**: `D1_Habit_Tracker_v1.0.0_PlayStore_Release.aab`
* **File Path**: `G:\STITCH HABIT TRACKER\D1_Habit_Tracker_v1.0.0_PlayStore_Release.aab`
* **Size**: ~6.87 MB
* **Use Case**: **Play Store par upload karne ke liye ONLY yeh `.aab` file drag-and-drop karein.**

### B. Signed Release APK (.apk)
* **File Name**: `D1_Habit_Tracker_v1.0.0_Signed_Release.apk`
* **File Path**: `G:\STITCH HABIT TRACKER\D1_Habit_Tracker_v1.0.0_Signed_Release.apk`
* **Size**: ~5.77 MB
* **Use Case**: Direct kisi bhi Android device par bina Play Store ke install (sideload) karke check karne ke liye.

---

## 4. GOOGLE PLAY CONSOLE UPLOAD STEPS

1. Open [Google Play Console](https://play.google.com/console/).
2. Select your App (**D1 Habit Tracker**).
3. Left navigation bar mein **Release** -> **Production** (ya *Closed testing* / *Internal testing*) par click karein.
4. Top-right mein **Create new release** button dabayein.
5. **App bundles** box ke andar yeh file drag & drop karein:
   ```text
   G:\STITCH HABIT TRACKER\D1_Habit_Tracker_v1.0.0_PlayStore_Release.aab
   ```
6. **Release Name**: `1.0.0`
7. **Release Notes**:
   ```text
   Initial launch of D1 Habit Tracker.
   - Comprehensive habit tracking & daily consistency.
   - Minimalist dark/light mode with sleek resilience hub.
   - Interactive streaks matrix & analytics.
   ```
8. **Next** par click karke review karein aur **Save / Start rollout to Production** par click kar dein!

---

## 5. FUTURE APP UPDATES (RE-BUILD COMMANDS)

Jab bhi aap app mein naye features add karke Google Play Store ke liye naya version build karenge:

1. `android/app/build.gradle` mein version increment karein:
   ```groovy
   versionCode 2      // Increment by 1 every release
   versionName "1.0.1"
   ```
2. Terminal (PowerShell) mein yeh commands run karein:
   ```powershell
   # 1. Build frontend & sync capacitor
   cd "G:\STITCH HABIT TRACKER\definite-habit-tracker"
   npm run build
   npx cap sync android

   # 2. Build signed Play Store Bundle (.aab)
   cd android
   .\gradlew.bat bundleRelease

   # 3. Build signed APK (.apk)
   .\gradlew.bat assembleRelease
   ```
3. Nayi `.aab` file `android/app/build/outputs/bundle/release/app-release.aab` mein ready milegi!
