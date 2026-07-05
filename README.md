# 📱 MedSafe - Android Medication Compliance Tracker & Web Simulator

[![Kotlin](https://img.shields.io/badge/Kotlin-1.9.0-purple.svg?style=flat&logo=kotlin)](https://kotlinlang.org)
[![Android SDK](https://img.shields.io/badge/Android-SDK%2034-green.svg?style=flat&logo=android)](https://developer.android.com)
[![Room Database](https://img.shields.io/badge/SQLite-Room%20DB-blue.svg?style=flat&logo=sqlite)](https://developer.android.com/training/data-storage/room)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An offline-first, native Android medication compliance tracker built with **Kotlin, Room SQLite Database, and AlarmManager**. It ensures patients never miss a dose, automates stock management, logs history, and alerts contacts during consecutive misses.

This repository also hosts a **high-fidelity web portfolio simulator** that lets users, developers, and recruiters interact with the app's native features directly in their web browser without installing the APK.

👉 **[Launch Live Web Simulator Demo](https://anant-sketch.github.io/medsafe-portfolio)**

---

## 🌟 Core Features

### 📅 Smart Dashboards
*   **Active Schedules**: Lists today's remaining medications, dosages, and administration details.
*   **Adherence Rings**: An interactive, dynamic compliance ring visualizing user medication compliance rates.

### ⏰ Reliable Exact Alarms
*   Uses Android's `AlarmManager` with exact scheduling (`setExactAndAllowWhileIdle`) to ensure alerts trigger reliably even when the device enters Doze battery-saving mode.
*   Background broadcast channels post high-importance notification banners.

### 🕒 Automatic Miss Logs & Grace Period
*   Includes a background receiver that triggers 1 hour after a scheduled dose. 
*   If the dose is not marked as taken within the **1-hour grace period**, the app automatically logs it as **Missed**.

### 🚨 Critical Safety Alert (Safety Net)
*   Monitors consecutive medication logs.
*   If a user misses **3 consecutive doses** of a critical medication, it triggers a system-level emergency warning page.

---

## 🛠️ Architecture & Tech Stack

The native Android app is architected using **Android Architecture Components** following clean code principles:

*   **View-Model-Repository** pattern for separation of concerns.
*   **Room Database** (SQLite abstraction) for fast, structured local storage.
*   **Coroutines** for asynchronous background thread operations.
*   **BroadcastReceivers** for exact alarm monitoring and notification action intercepts (e.g. marking "Taken" from notification drawer).

---

## 📂 Repository Structure

*   `/app`: Native Android Studio gradle codebase containing Kotlin source code.
*   `/public`, `index.html`, `app.js`: High-fidelity web simulator landing page showing mockup device views.

---

## 🚀 How to Run Locally

### Native Android App
1. Open **Android Studio** and click *Open*.
2. Select the `/app` folder inside this repository.
3. Enable **USB Debugging** on your Android device and connect it to your PC.
4. Select your phone in the top toolbar and press the green **Run (Play)** icon.

### Web Portfolio Simulator
1. Navigate to the root directory.
2. Double-click **`index.html`** or open it via a local static server to test the browser simulator.
