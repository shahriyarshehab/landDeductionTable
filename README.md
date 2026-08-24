<div align="center">

# 🌾 জমি কর্তন টেবিল (Land Deduction Table - LDD4IG)

[![Version](https://img.shields.io/badge/Version-v4.5-6E56FF?style=for-the-badge&logo=appveyor)](https://github.com/shahriyarshehab/landDeductionTable)
[![Branch](https://img.shields.io/badge/Branch-feature%2Fsmart--v4.5--updates-12B8A3?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25%20Offline%20Mobile-33E0C7?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![License](https://img.shields.io/badge/License-Copyright%20©%202026-C9922B?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)

<br/>

**Land Data Digitalization for Inclusive Growth (LDD4IG)**  
*সঠিক পরিমাপ ও অন্তর্ভুক্তিমূলক প্রবৃদ্ধিতে স্মার্ট ডিজিটাল ভূমিসেবা*

[🚀 Quick Start](#-quick-start) • [✨ Key Features](#-key-features) • [📁 Directory Structure](#-project-architecture) • [💡 Usage & Shortcuts](#-keyboard-shortcuts--tips)

</div>

---

> [!NOTE]
> **জমি কর্তন টেবিল** হলো ভূমি জরিপ, খতিয়ান ব্যবস্থাপনা এবং দাগ-ভিত্তিক জমির কর্তন হিসাব রিয়েল-টাইমে পরিচালনার জন্য তৈরি একটি আধুনিক, ১০০% ক্লায়েন্ট-সাইড (Client-side) ওয়েব অ্যাপ্লিকেশন। এটি ব্যবহার করে অত্যন্ত নির্ভুলভাবে মোট জমি, বিভিন্ন হোল্ডিং অনুযায়ী কর্তন এবং অবশিষ্ট জমির অটোমেটেড হিসাব প্রস্তুত করা যায়।

---

## 📁 Project Architecture

The codebase follows a clean, modular folder hierarchy separating markup, styling, JavaScript logic, PWA service workers, and media assets:

```
landDeductionTable/
├── 📄 index.html            # Primary application entry point
├── 🎨 css/
│   └── 📄 styles.css        # Design tokens, themes (Aurora Light/Dark), over-deduction & progress bar CSS
├── ⚡ js/
│   └── 📄 app.js            # Math engine, real-time ratio bar calculations, PWA handlers & LocalStorage
├── ⚙️ sw.js                 # PWA Service Worker for 100% offline caching
├── 📱 manifest.json        # Web App Manifest for mobile installation
├── 🖼️ assets/
│   ├── 🖼️ logo.svg          # Brand vector logo asset
│   └── 🖼️ devImage.jpeg     # Developer avatar image asset
└── 📝 README.md             # Project documentation & reference guide
```

---

## ✨ Key Features (v4.5 Release)

### 📊 1. Real-Time & Saved Cards Visual Plot Progress Bar
* **Real-Time Keystroke Calculation**: Displays an animated gradient progress bar comparing **Deducted Land %** vs **Remaining Land %** in real-time as users type.
* **Compact Saved Cards Indicator**: Renders a sleek mini ratio bar on every saved holding card row (`.mini-plot-progress-bar`).

### ⚠️ 2. Over-Deduction Neon Warning System
* **Automatic Over-Deduction Alert**: Detects if total deduction exceeds total plot land area and highlights the row in glowing neon red with a `⚠️ অতি-কর্তন!` alert badge.

### 📲 3. Progressive Web App (PWA) & 100% Offline Mobile Operation
* **Add to Home Screen**: Installable as a standalone native app on Android, iOS, and Desktop devices with `manifest.json`.
* **Service Worker Caching (`sw.js`)**: Runs 100% offline in rural areas with zero internet connectivity.

### 📱 4. Mobile-First Touch Optimization
* Enlarged touch target heights (min 44px) for effortless mobile operation, smooth horizontal table scrolling, and touch-friendly controls.

### 🌅 5. Dual Theme System (Aurora Light & Dark Glassmorphic UI)
* Smooth animated theme toggle supporting light and dark color schemes built with CSS Custom Properties and `@supports` minimal fallback mode.

---

## ⚡ Tech Stack & Libraries

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 / CSS3 Tokens | Modular components, CSS variables, glassmorphism, responsive grid |
| **Logic & Math** | JavaScript (ES6+) | Precise decimal arithmetic engine & Bangla digit parsing (`BN_DIGITS`) |
| **Offline App** | PWA Service Worker | Caches shell & assets for 100% offline availability |
| **Spreadsheets** | SheetJS (`xlsx.full.min.js`) | Client-side `.xlsx` workbook & worksheet compilation |

---

## 💡 Keyboard Shortcuts & Tips

| Action | Shortcut / Input Syntax | Result |
| :--- | :--- | :--- |
| **Next Cell Entry** | <kbd>Tab</kbd> or <kbd>Enter</kbd> | Move focus seamlessly across Khatian, Holding, Dag, and Land cells |
| **Auto Row Addition** | <kbd>Enter</kbd> in last deduction cell | Automatically appends a new Plot (দাগ) row for high-speed data entry |
| **Deduction Math** | `১.৫০+০.৫০` or `১, ২, ৩` | Automatically computes totals and updates remaining land balance |
| **Column Split** | Click **'হোল্ডিং অনুযায়ী কর্তন'** | Expands multi-value entries into dedicated holding columns |

---

## 🚀 Quick Start

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/shahriyarshehab/landDeductionTable.git
   git checkout feature/smart-v4.5-updates
   ```
2. **Open in Browser**:
   Double click [`index.html`](file:///c:/Users/Shahriyar%20Shehab/Desktop/landDeductionTable/index.html) or launch it using any modern browser (Chrome, Edge, Firefox, Safari).

---

## 👨‍💻 Developer & Facilitation

<div align="center">

<img src="./assets/devImage.jpeg" width="110" height="110" style="border-radius: 50%; object-fit: cover; box-shadow: 0 4px 14px rgba(110,86,255,0.3);" alt="Shahriyar Shehab">

### **Shahriyar Shehab**
**Data Management Facilitator (DMF)**  
*Project:* **LDD4IG** (*Land Data Digitalization for Inclusive Growth*)

</div>

---

## 📜 License

© 2026 **LDD4IG Project** · All Rights Reserved.  
*স্মার্ট ভূমি সেবা, ডিজিটাল বাংলাদেশ।*
