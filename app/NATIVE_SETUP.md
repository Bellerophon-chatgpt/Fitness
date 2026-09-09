# Native apps + Health sync (Capacitor)

The web app stays a PWA on Vercel exactly as before. Capacitor *additionally*
wraps the built `dist/` in native iOS/Android shells, which unlocks Apple Health
(HealthKit) and Google Health Connect. The bodyweight sync button in the Doelen
tab only appears inside the native app; on the web it's hidden.

**You build the native apps on your own machine — this can't be done on Vercel
or in Codespaces.** Prerequisites: a **Mac with Xcode** for iOS (plus a paid
Apple Developer account, €99/yr, to run on a device or ship), and **Android
Studio** for Android. The health plugin used is
[`@capgo/capacitor-health`](https://github.com/Cap-go/capacitor-health) (free,
HealthKit + Health Connect, Capacitor 8).

## 1. One-time: add the native platforms

From `app/` (after `npm install`, which now pulls in Capacitor):

```bash
npm run build              # produce dist/
npx cap add ios            # creates ios/  (run on a Mac)
npx cap add android        # creates android/
```

`capacitor.config.ts` is already set (appId `nl.formfuel.app`, webDir `dist`).
Commit the generated `ios/` and `android/` folders.

## 2. Every time you change the web app

```bash
npm run build
npx cap sync               # copies dist/ into the native projects + updates plugins
```

## 3. iOS — enable HealthKit

- Open the project: `npx cap open ios` (Xcode).
- Select the app target → **Signing & Capabilities** → **+ Capability** →
  **HealthKit**.
- The plugin needs two usage strings. In `ios/App/App/Info.plist` add:

  ```xml
  <key>NSHealthShareUsageDescription</key>
  <string>FORM&amp;FUEL leest je gewicht uit Apple Health om je trend en doelen bij te werken.</string>
  <key>NSHealthUpdateUsageDescription</key>
  <string>FORM&amp;FUEL schrijft geen gegevens; alleen lezen van je gewicht.</string>
  ```

- Run on a real device (HealthKit doesn't work in the simulator for real data).
  The first time you tap "Synchroniseer", iOS shows the Health permission sheet.

## 4. Android — enable Health Connect

- `npx cap open android` (Android Studio).
- Health Connect works on Android 8+; on Android 13 and below the user installs
  "Health Connect by Android" from the Play Store (the plugin exposes
  availability so the app can prompt).
- The plugin's manifest already declares the `READ/WRITE_WEIGHT` permissions.
- **Privacy policy is required** by Health Connect. Add a URL in
  `android/app/src/main/res/values/strings.xml`:

  ```xml
  <string name="health_connect_privacy_policy_url">https://fitness-flame-pi.vercel.app/privacy</string>
  ```

  (Point it at a page describing that weight is read locally and only stored in
  your own account — you'll need to publish such a page.)

## 5. What it does

In the Doelen tab, "Synchroniseer met Apple Health / Health Connect" reads your
recent body-weight samples (e.g. from a smart scale) and merges them into your
weight log — one per day, most recent wins. That feeds the trend line and the
adaptive calorie goal automatically, so you stop typing your weight by hand.

Only weight is read for now. The same plugin also exposes steps, active calories,
heart rate and workouts, so activity-based TDEE and workout import are natural
next steps.

## Notes

- The web/PWA build is unaffected: `@capacitor/core` adds ~9 kB gzip for platform
  detection; the health plugin is lazy-loaded and never runs on the web.
- Shipping to the App Store / Play Store requires the usual store review, and
  Apple's guideline 5.1.3 (health data) plus a privacy policy.
