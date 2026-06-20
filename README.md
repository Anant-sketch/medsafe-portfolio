# MedSafe - Android Medication Compliance Tracker & Web Simulator

A high-fidelity interactive showcase and web simulator for **MedSafe**, an offline-first native Android medication reminder application built with Kotlin, Room Database, and AlarmManager.

This repository hosts a web-based portfolio landing page and mobile device emulator designed to let recruiters, developers, and users interact with the app's features directly in their browser.

## 🌟 Interactive Features
*   **Active Dashboard**: View today's remaining medications, dosages, types (pills, syrups, injections), and a real-time medication adherence compliance ring.
*   **Add Medicine Form**: Simulate inserting new medicines into the database, setting alarm schedules, and setting starting stock counts.
*   **Exact Alarm Notifications**: Trigger simulated scheduled alarms to see the high-priority lock-screen notification drawer slide down with interactive "Taken" and "Snooze" actions.
*   **Compliance Log (History)**: Track compliance logs indicating whether a dose was Taken (with timestamp) or Missed.
*   **Missed Dose & Stock Management**: Deducts stock upon marking a dose as taken. Auto-flags pending doses as missed after a simulated 1-hour timeout.
*   **Critical Emergency Alerts**: Simulates triggering a full-screen system alert warning when 3 consecutive doses of a medication are missed.

## 🛠️ Tech Stack Shown
The native Android app's architecture and source code is documented on this landing page, focusing on:
*   **Android SDK & Kotlin Coroutines** for background threading.
*   **Room Persistence Library (SQLite)** database schemas.
*   **AlarmManager** with exact alarms (`setExactAndAllowWhileIdle`) for reliability in Doze mode.
*   **BroadcastReceiver** channels for notification actions.

---

## 🚀 How to Host This on GitHub Pages

You can publish this interactive simulator instantly to the web for free using GitHub Pages:

1.  **Create a new empty repository** on your GitHub account named `medsafe-portfolio`.
2.  **Initialize Git** in this directory and push:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of MedSafe web portfolio and simulator"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/medsafe-portfolio.git
    git push -u origin main
    ```
3.  **Enable GitHub Pages**:
    *   Go to your repository settings on GitHub.
    *   Navigate to the **Pages** section in the left sidebar.
    *   Under **Build and deployment**, select **Deploy from a branch**.
    *   Choose the `main` branch and click **Save**.
4.  Within a few minutes, your site will be live at `https://YOUR_USERNAME.github.io/medsafe-portfolio/`!
