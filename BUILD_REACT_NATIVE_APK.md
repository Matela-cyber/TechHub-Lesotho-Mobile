# Building APKs with EAS Build

Both React Native apps are ready. Follow these steps to build the APKs.

## Prerequisites

1. Create a free Expo account at https://expo.dev/signup
2. Install EAS CLI globally:
   ```
   npm install -g eas-cli
   ```
3. Log in to your Expo account:
   ```
   eas login
   ```

---

## Build the Customer Shop APK

```bash
cd "C:\Users\Lenovo\Desktop\TechHub-Lesotho - mobile\shop-native"

# Configure EAS (first time only — accept defaults)
eas build:configure

# Build APK (free, no Android Studio needed)
eas build --platform android --profile preview
```

When prompted, choose:

- **Bundle identifier**: `com.techhub.lesotho`
- **Generate new keystore**: Yes (first time)

EAS will upload your code to Expo's cloud servers and build the APK.
You'll get a **download link** when done (usually 5–15 minutes).

---

## Build the Admin App APK

```bash
cd "C:\Users\Lenovo\Desktop\TechHub-Lesotho - mobile\shopAdmin-native"

eas build:configure
eas build --platform android --profile preview
```

Bundle identifier: `com.techhub.lesotho.admin`

---

## Update app.json Before Building

In `shop-native/app.json`, replace `"your-eas-project-id"` with the real project ID shown after running `eas build:configure`.

---

## Test Locally with Expo Go (No Build Needed)

To test immediately on your phone:

1. Install **Expo Go** from the Play Store
2. Run in each project folder:
   ```
   npx expo start
   ```
3. Scan the QR code with your phone

> Note: Firebase may require adding your device's IP to authorized domains if you encounter auth errors during local testing.

---

## App Summary

| App              | Package                   | Purpose               |
| ---------------- | ------------------------- | --------------------- |
| shop-native      | com.techhub.lesotho       | Customer shopping app |
| shopAdmin-native | com.techhub.lesotho.admin | Admin management app  |

Both apps connect to the same Firebase project (`techhub-lesotho`).
