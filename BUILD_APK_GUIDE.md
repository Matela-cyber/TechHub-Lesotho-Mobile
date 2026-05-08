# TechHub Lesotho — Mobile APK Build Guide

Both apps are now fully set up with **Capacitor** and ready to be built into APKs.

---

## What Was Done

|                   | shop-main                               | shopAdmin-main              |
| ----------------- | --------------------------------------- | --------------------------- |
| Capacitor version | 8.x                                     | 8.x                         |
| App ID            | `com.techhub.lesotho`                   | `com.techhub.lesotho.admin` |
| App Name          | TechHub Lesotho                         | TechHub Admin               |
| Android project   | `shop-main/android/`                    | `shopAdmin-main/android/`   |
| Google OAuth      | Hidden in mobile (email/password works) | N/A (email only)            |
| Service Worker    | Disabled in mobile                      | N/A                         |

---

## Step 1 — Install Android Studio (One-Time Setup)

1. Download from: **https://developer.android.com/studio**
2. Run the installer — it bundles the JDK + Android SDK automatically
3. On first launch, let it download the Android SDK components
4. Make sure "Android SDK Build-Tools" and "Android SDK Platform 34" are installed  
   _(SDK Manager → SDK Tools)_

---

## Step 2 — Build the Customer App APK (shop-main)

### Option A: Debug APK (fastest, for testing)

```powershell
cd "shop-main"
cd android
.\gradlew assembleDebug
```

Output: `android\app\build\outputs\apk\debug\app-debug.apk`

### Option B: Release APK (for distribution)

```powershell
cd "shop-main"
cd android
.\gradlew assembleRelease
```

Output: `android\app\build\outputs\apk\release\app-release-unsigned.apk`

> For Play Store you need to sign it. Use Android Studio:  
> Build → Generate Signed Bundle/APK → APK → create a keystore

### Option C: Open in Android Studio (easiest visual option)

```powershell
cd "shop-main"
npx cap open android
```

Then in Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

---

## Step 3 — Build the Admin App APK (shopAdmin-main)

Same process as above but from `shopAdmin-main/`:

```powershell
# Debug APK
cd "shopAdmin-main\android"
.\gradlew assembleDebug
# Output: android\app\build\outputs\apk\debug\app-debug.apk

# Or open in Android Studio
cd "shopAdmin-main"
npx cap open android
```

---

## Step 4 — After Any Code Changes

Whenever you update the React code, re-sync before rebuilding the APK:

```powershell
# For shop-main
cd "shop-main"
npm run cap:sync

# For shopAdmin-main
cd "shopAdmin-main"
npm run cap:sync
```

This rebuilds the web bundle and copies it into the Android project.

---

## Installing the APK on a Device

1. Enable **Developer Options** on your Android phone:  
   Settings → About Phone → tap "Build Number" 7 times
2. Enable **USB Debugging** and **Install from Unknown Sources**
3. Transfer the `.apk` file to your phone and open it
4. Or use ADB: `adb install app-debug.apk`

---

## Firebase Notes

- Both apps use the same Firebase project: `techhub-lesotho`
- Firestore, Auth (email/password), and Storage all work in the WebView
- **Google Sign-In is hidden on mobile** — users sign in with email + password
  - If you want Google Sign-In on mobile later, add the  
    `@capacitor-community/firebase-authentication` plugin
- The Firebase App ID for the customer app is `web:8ac6b3a5a389a658dde913`
- The Firebase App ID for the admin app is `web:1eb03128a28d167fdde913`

---

## Troubleshooting

| Problem                      | Fix                                                                    |
| ---------------------------- | ---------------------------------------------------------------------- |
| `SDK location not found`     | Open Android Studio once to let it download the SDK                    |
| `JAVA_HOME not set`          | Android Studio sets this automatically; restart terminal after install |
| `gradlew: Permission denied` | Run `icacls gradlew /grant Everyone:F`                                 |
| App shows blank white screen | Run `npm run cap:sync` then rebuild APK                                |
| Firebase connection fails    | Check internet permission is in `AndroidManifest.xml` (it is)          |
