# 🏋️ Lift — Open-Source Personal Gym Tracker (Android)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Android-blue.svg)](https://www.android.com/)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2058-white.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Storage](https://img.shields.io/badge/Storage-Local%20SQLite-yellow.svg)](https://docs.expo.dev/versions/latest/sdk/sqlite/)

**Lift** is a minimalist, local-first gym lift tracking application built for Android lifters who value focus, battery efficiency, and zero cloud friction. Designed with a true OLED dark theme, high-contrast typography, and deep Android native integration.

---

## ✨ Features

- ⏱️ **Workout Timer & Minimizable Active Bar**: Non-drifting elapsed session timer resilient across screen locks.
- 🎯 **Double Progression & Progressive Overload Engine**: Prompts you to step up weight (+5 lbs / +2.5 kg) the moment you hit the ceiling of your target rep range.
- 📊 **RPE & RIR Exertion Tracking**: Log Rating of Perceived Exertion (1–10) or Reps in Reserve (0–4) for every set.
- ⚙️ **Gym Machine Variations**: Track separate seat heights, pulley ratios (e.g. 2:1 cable), and PRs across specific machine brands (Hammer Strength, Life Fitness, Cybex).
- 📅 **Interactive Workout Calendar**: Monthly calendar grid highlighting training frequency, workout duration, and volume.
- ⚡ **Fitbit / Google Health Connect Integration**: Imports sleep time, recovery readiness score, daily steps, and resting heart rate directly into an actionable training readiness widget.
- 📲 **Interactive Android Home Screen Widget**: Log sets and adjust weight/reps directly from your Android home screen without opening the app.
- 🔔 **Android Notification Shade Bar**: Pinned ongoing workout notification bar with quick set check-off and rest countdown controls.
- 🏆 **Rewarding PR Milestone Notifications**: Gold trophy celebration with delta weight increase and multi-pulse haptics.
- ⏱️ **Customizable Rest Timer**: Inline countdown with +15s / -15s quick adjustments and per-exercise remembered durations.
- 💿 **Plate & 1RM Calculators**: Visual barbell sleeve loading diagram (lbs & kg) + scientific Epley and Brzycki one-rep max percentages.
- 📥 **CSV Data Export & Import**: Full data portability. Export and import workouts via standard spreadsheet formats compatible with Excel, Google Sheets, Strong, and Hevy.
- 🖤 **OLED Dark Minimalist Design**: Ultra-clean true black (`#08090B`) palette with razor-sharp tabular typography and subtle mint accents.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- Android phone with the [Expo Go app](https://play.google.com/store/apps/details?id=host.exp.exponent) installed

### Installation & Local Run
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/lift.git
cd lift

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```
Scan the displayed QR code with **Expo Go** on your Android phone to launch the app instantly.

---

## 📦 Building a Standalone Android APK

Lift comes pre-configured with `eas.json` for one-command standalone APK generation:

```bash
# Build standalone .apk using EAS Cloud Build
npx eas build -p android --profile preview
```
Once the build completes, EAS prints a direct download link and QR code to install the `.apk` directly onto your Android device.

---

## 🏗️ Project Architecture

```
lift/
├── App.tsx                     # Main tab navigation and global providers
├── app.json                    # Expo & Android native configuration
├── eas.json                    # Standalone APK build profile
└── src/
    ├── constants/
    │   ├── theme.ts            # High-contrast OLED dark color system
    │   └── presetExercises.ts  # Pre-seeded compound and isolation exercise library
    ├── db/
    │   └── database.ts         # SQLite tables, migrations, PR calculation engine
    ├── context/
    │   ├── WorkoutContext.tsx  # Active session state, elapsed timer, overload engine
    │   └── SettingsContext.tsx # User preferences (lbs/kg, RPE/RIR scale, rest duration)
    ├── services/
    │   ├── csvService.ts       # CSV export & import with file picker
    │   ├── healthConnect.ts    # Google Health Connect / Fitbit Air readiness sync
    │   ├── notificationService.ts # Android ongoing notification bar manager
    │   └── widgetService.ts    # Android Home Screen AppWidget data bridge
    ├── components/
    │   ├── workout/            # ActiveWorkoutModal, SetRow, OverloadModal, PRModal, RestTimer
    │   ├── history/            # WorkoutCalendarView
    │   ├── health/             # ReadinessCard (Fitbit / Health Connect)
    │   ├── exercises/          # MachineSelectorModal, ExerciseSelector, CreateCustom
    │   ├── plates/             # PlateCalculatorModal (visual barbell sleeve)
    │   ├── calculator/         # OneRepMaxModal (Epley/Brzycki formulas)
    │   └── charts/             # LineChart and VolumeBarChart (SVG)
    └── screens/
        ├── WorkoutsScreen.tsx  # Quick start, routines list, readiness card
        ├── HistoryScreen.tsx   # Calendar view, past workout log, weekly volume
        ├── ExercisesScreen.tsx # Filterable exercise library with 1RM line charts
        └── ToolsScreen.tsx     # Plate & 1RM calculators, CSV backup, preferences
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
