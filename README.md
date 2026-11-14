# 🏋️ L!FT — Minimalist, Local-First Android Workout Tracker

<p align="center">
  <img src="./assets/icon.png" alt="L!FT Icon" width="120" height="120" style="border-radius: 24px;" />
</p>

<p align="center">
  <b>A distraction-free, local-first gym tracker engineered for lifters.</b><br />
  Pure pitch-black AMOLED dark mode, on-device voice logging, double progression engine, smart plate calculator, and zero subscription paywalls.
</p>

<p align="center">
  <a href="https://github.com/NoroThinksHeCanCode/lift/releases/latest/download/Lift-v1.0.7.apk"><img src="https://img.shields.io/badge/Download%20APK-v1.0.7-10B981.svg?style=for-the-badge&logo=android&logoColor=white" alt="Download APK" /></a>
  <a href="https://github.com/NoroThinksHeCanCode/lift/releases"><img src="https://img.shields.io/badge/Release-v1.0.7-06B6D4.svg?style=for-the-badge" alt="Release v1.0.7" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%2011+-3DDC84.svg?logo=android&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg?logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2058-000000.svg?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Database-Local%20SQLite-003B57.svg?logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Speech-On--Device%20Offline-FF6B6B.svg" alt="Offline Speech" />
</p>

---

## ⚡ Why L!FT?

Most modern workout tracking apps are cluttered with social feeds, mandatory accounts, cloud sync latencies, expensive monthly subscriptions, and bright white interfaces that drain battery. 

**L!FT** is built with a different philosophy:
- **Zero Cloud & Zero Telemetry**: Your data lives only on your device in a local SQLite database. No accounts, no subscriptions, no tracking, works completely offline in basement gyms or airplane mode.
- **Pure AMOLED Pitch Black (`#000000`)**: Minimalist, high-contrast Instagram-style dark mode engineered for maximum OLED battery savings and zero gym glare.
- **Engineered for Lifters**: Double progression prompts, gym plate inventory math, exercise machine seat memory, joint action tagging, and hands-free voice logging.

---

## ✨ Core Features

### 🎙️ Hands-Free Offline Voice Logging (NEW in v1.0.7)
Log sets between heavy efforts without having to tap on the screen with chalky or sweaty hands:
- **100% On-Device Speech Recognition**: Leverages Android's native `SpeechRecognizer` (`EXTRA_PREFER_OFFLINE = true`). Zero cloud audio streaming, zero latency, zero privacy concerns.
- **Gym-Native Natural Speech Parser (`parseGymSpeech`)**:
  - **Weight + Reps**: *"225 for 8"*, *"100 kg 10 reps"*, *"185 by 5"*, *"80 x 12"*, *"50 pounds 15 reps"*
  - **Barbell Plate Slang**: *"two plates for 10"* (auto-converts to 225 lbs / 100 kg), *"one plate for 12"* (135 lbs / 60 kg), *"three plates for 5"* (315 lbs / 140 kg)
  - **Bodyweight Sets**: *"bodyweight for 15"*, *"body weight 12 reps"* (logs 0 lbs/kg with reps)
  - **Carryover Weights**: *"same weight for 8"*, *"just 10 reps"* (inherits weight from target set)
  - **Decimals & Half-Kilos**: *"twenty two and a half for 10"* (parses to 22.5)
  - **Spoken Compounds**: *"two twenty five for 8"* -> 225 lbs × 8
  - **RPE / RIR**: *"225 for 8 RPE 8"*, *"100 for 6 at 2 RIR"*
- **Pulsing Mic Visualizer**: Interactive audio RMS-reactive microphone animation, real-time live transcript display, detected stats preview pill, target exercise switcher, and instant auto-rest timer trigger.

---

### 🖤 AMOLED Pure Black Aesthetic
- True `#000000` background across all screens, modals, cards, and toolbars.
- Ultra-sharp typography with tabular numeric alignment (`fontVariant: ['tabular-nums']`) for weights, reps, and timers.
- Subtle emerald (`#10B981`) and cyan (`#06B6D4`) accent palette with zero visual bloat.

---

### 📋 Full Routine Management & Routine Editing (v1.0.6)
- **Comprehensive Routine Editor**: Create and edit routines anytime — rename routine, add custom description, add or remove exercises, reorder movements, and customize default sets and target rep ranges per exercise.
- **Quick-Start & Ad-Hoc Sessions**: Start an empty workout or jump straight into a saved routine (Push, Pull, Legs, Upper, Lower, etc.).

---

### 🎯 Double Progression & Progressive Overload Engine
- Set custom target rep ranges for individual exercises or lock a universal rep bracket across your entire workout (e.g. 8–12 reps).
- The moment you complete a set at the top of your target rep range, L!FT prompts you with a 1-tap progressive overload increase (+5 lbs / +2.5 kg) for your subsequent sets.

---

### ⏱️ Rest Timer with Instant ±30s Stepper Controls
- **Unified Rest Duration**: Configure your default rest duration in Tools, or customize it dynamically per workout.
- **Quick Adjust Stepper Toolbar**: Instant `-30s` and `+30s` stepper buttons right in the active workout toolbar to adapt rest times on the fly without interrupting your session.
- **Auto-Countdown**: Starts automatically whenever a set is checked off or logged via voice.

---

### 🏆 Floating PR Toast & Dynamic 1RM Estimation
- Replaced disruptive full-screen popups with an elegant, non-intrusive floating top banner with haptic feedback.
- Instantly calculates and displays your **Estimated 1-Rep Max** alongside the newly achieved weight or rep PR.

---

### 📊 Post-Workout Summary Card & PR Calendar
- **Workout Summary Card**: End-of-workout debrief detailing total elapsed time, total volume moved, sets completed, and all new PRs hit during the session.
- **Interactive Calendar**: Visual monthly training frequency heat map with PR workout days highlighted in distinct glowing gold.

---

### 📝 Per-Exercise Notes & Machine Seat Memory
- **Per-Exercise Notes**: Attach persistent notes directly to any exercise (e.g., grip width, warmup cues, tempo reminders).
- **Machine Variant Tracking**: Remember seat heights, pin settings, and pulley ratios across different machine brands (Hammer Strength, Life Fitness, Cybex, etc.).

---

### 🦴 Joint Action & Anatomical Classification
- Classify exercises by their biomechanical **Joint Action** (e.g., *Flexion, Extension, Abduction, Adduction, Horizontal Adduction, Scapular Retraction, Plantarflexion*).
- Comprehensive equipment categories: *Barbell, Dumbbell, Machine, Cable, Bodyweight, Smith Machine, Weighted Bodyweight*.

---

### 💿 Smart Plate Inventory Calculator & 1RM Suite
- **Inventory-Aware Sleeve Math**: Enter your gym's available plates (pairs of 45s, 35s, 25s, 10s, 5s, 2.5s or 20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg) and barbell tare weight (45 lbs / 20 kg). L!FT tells you *exactly* what plates to stack per side.
- **One-Rep Max Calculator**: Calculate 1RM using scientific Epley and Brzycki formulas, accompanied by a complete percentage training breakdown (50% to 95%).

---

### 📲 Android Home Screen Widget & Notifications
- **Interactive AppWidget**: View active workout progress and log sets directly from your Android launcher.
- **Pinned Notification Shade Bar**: Ongoing foreground service notification keeping the rest timer countdown and active set status visible even with the screen locked.

---

### 💾 100% Data Portability (CSV Export & Import)
- Export your complete workout history, exercises, and sets into clean CSV format anytime.
- Import data from spreadsheets or migrate seamlessly from Strong and Hevy.

---

## 📥 Download & Installation

### Option 1: Direct Standalone APK (Recommended)
Download the latest pre-compiled standalone release APK directly from GitHub:

👉 [**Download Lift-v1.0.7.apk**](https://github.com/NoroThinksHeCanCode/lift/releases/download/v1.0.7/Lift-v1.0.7.apk) *(~87 MB)*

1. Open the downloaded `.apk` file on your Android device.
2. If prompted, allow "Install unknown apps" for your browser/file manager.
3. Install and start lifting!

---

### Option 2: Build From Source

#### Prerequisites
- Node.js (v20+ recommended)
- Java 17 (JDK)
- Android SDK & Build Tools (API 34+)

```bash
# 1. Clone the repository
git clone https://github.com/NoroThinksHeCanCode/lift.git
cd lift

# 2. Install dependencies
npm install

# 3. Run in Expo development mode
npx expo start

# 4. Or compile a release APK locally using Gradle
cd android
chmod +x gradlew
./gradlew assembleRelease -Pandroid.enableMinifyInReleaseBuilds=false
```
The compiled APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`.

---

## 🏗️ Project Architecture

```
lift/
├── android/
│   ├── app/src/main/
│   │   ├── AndroidManifest.xml          # Record audio & speech queries permissions
│   │   └── java/com/lift/app/
│   │       ├── LiftSpeechModule.kt      # Native Android SpeechRecognizer module (offline)
│   │       ├── LiftNativeModule.kt      # Android widget & notification bridge
│   │       ├── LiftPackage.kt           # React Native native module registry
│   │       └── LiftAppWidgetProvider.kt # Android AppWidget launcher provider
├── src/
│   ├── constants/
│   │   ├── theme.ts                     # High-contrast AMOLED black palette (#000000)
│   │   └── presetExercises.ts           # Pre-seeded exercises with joint actions & muscles
│   ├── types/
│   │   └── index.ts                     # Strong TypeScript definitions for sets, routines, PRs
│   ├── db/
│   │   └── database.ts                  # SQLite tables, queries, migrations, PR calculation
│   ├── context/
│   │   ├── WorkoutContext.tsx           # Active session state, timer, overload engine, PRs
│   │   └── SettingsContext.tsx          # User preferences (units, rest timers, rep ranges)
│   ├── services/
│   │   ├── voiceLogger.ts               # Offline gym speech parser & speech event listener
│   │   ├── widgetService.ts             # Home screen widget state synchronization
│   │   ├── notificationService.ts       # Ongoing workout notification manager
│   │   └── csvService.ts                # CSV import and export engine
│   ├── utils/
│   │   ├── haptics.ts                   # Native tactile feedback triggers
│   │   ├── plateCalculator.ts           # Barbell plate inventory solver
│   │   └── oneRepMax.ts                 # Epley & Brzycki 1RM estimation formulas
│   ├── components/
│   │   ├── workout/
│   │   │   ├── VoiceLogModal.tsx        # Interactive pulsing mic & transcript preview
│   │   │   ├── ActiveWorkoutModal.tsx   # Core active workout logging interface
│   │   │   ├── ActiveWorkoutBar.tsx     # Minimized bottom session bar
│   │   │   ├── SetRow.tsx               # High-contrast set logging row with PR checks
│   │   │   ├── RestTimerModal.tsx       # Rest timer banner & countdown
│   │   │   ├── RestTimerPickerModal.tsx # Rest duration configuration modal
│   │   │   ├── RepRangePickerModal.tsx  # Min/max target rep range picker
│   │   │   ├── ExerciseNoteModal.tsx    # Per-exercise notes editor
│   │   │   ├── PRCelebrationModal.tsx   # Top floating PR celebration toast
│   │   │   ├── ProgressiveOverloadModal.tsx # Weight step-up prompt
│   │   │   └── WorkoutSummaryModal.tsx  # End-of-workout debrief card
│   │   ├── exercises/
│   │   │   ├── ExerciseSelectorModal.tsx
│   │   │   ├── MachineSelectorModal.tsx
│   │   │   └── CreateExerciseModal.tsx
│   │   ├── history/
│   │   │   └── WorkoutCalendarView.tsx  # Monthly calendar with PR day highlights
│   │   ├── plates/
│   │   │   └── PlateCalculatorModal.tsx # Barbell sleeve visualizer with plate inventory
│   │   ├── calculator/
│   │   │   └── OneRepMaxModal.tsx       # 1RM calculator with percentage breakdown
│   │   └── common/
│   │       ├── NamePromptModal.tsx      # Welcome name prompt
│   │       ├── Badge.tsx
│   │       └── Button.tsx
│   └── screens/
│       ├── WorkoutsScreen.tsx           # Quick start, routine builder & routine editor
│       ├── HistoryScreen.tsx            # Past workouts, calendar heat map & volume
│       ├── ExercisesScreen.tsx          # Filterable exercise library & progress charts
│       └── ToolsScreen.tsx              # Plate calculator, 1RM, rest settings, CSV backup
└── .github/workflows/
    └── build-apk.yml                    # Automated GitHub Actions standalone APK CI/CD
```

---

## 🔒 Privacy & Local-First Guarantee

- **No Remote Servers**: No account registration, no tracking SDKs, no Google Analytics, no third-party APIs.
- **No Cloud Speech**: The voice logger uses Android's local on-device speech engine (`RecognizerIntent.EXTRA_PREFER_OFFLINE`). Your voice never leaves your phone.
- **Your Data Stays Yours**: Full SQLite database stored in your app's sandboxed storage. One-tap export to CSV whenever you want to backup or analyze your data.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Feel free to fork, modify, and build upon it!
