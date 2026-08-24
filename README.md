<div align="center">

# 🌾 জমি কর্তন টেবিল (Land Deduction Table - LMAP)

[![Version](https://img.shields.io/badge/Version-v4.5-6E56FF?style=for-the-badge&logo=appveyor)](https://github.com/shahriyarshehab/landDeductionTable)
[![Project](https://img.shields.io/badge/Project-LMAP-12B8A3?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![Ministry](https://img.shields.io/badge/Ministry-Ministry%20of%20Land-33E0C7?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![Partner](https://img.shields.io/badge/Partner-UNDP%20Bangladesh-0070D2?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![License](https://img.shields.io/badge/License-Copyright%20©%202026-C9922B?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)

<br/>

**Land Management Automation Project (LMAP)**  
*জনবান্ধব ভূমিসেবা অটোমেশন — স্বচ্ছতার সাথে ভূমিসেবা সহজেই*

**Ministry of Land | United Nations Development Programme (UNDP) Bangladesh**

[🚀 Quick Start](#-quick-start) • [✨ Key Features](#-key-features) • [📁 Directory Structure](#-project-architecture) • [💡 Usage & Shortcuts](#-keyboard-shortcuts--tips)

</div>

---

> [!IMPORTANT]
> **Project Scope**: *Implementation of the Holding Data and Khatian Data Entry and Verification in Integrated System for Land Management Automation Project (LMAP)*  
> **অফিশিয়াল স্লোগান**: *জনবান্ধব ভূমিসেবা অটোমেশন — স্বচ্ছতার সাথে ভূমিসেবা সহজেই*

> [!NOTE]
> **জমি কর্তন টেবিল** হলো ভূমি জরিপ, খতিয়ান ব্যবস্থাপনা এবং দাগ-ভিত্তিক জমির কর্তন হিসাব রিয়েল-টাইমে পরিচালনার জন্য তৈরি একটি আধুনিক, ১০০% ক্লায়েন্ট-সাইড (Client-side) ওয়েব অ্যাপ্লিকেশন। এটি ব্যবহার করে অত্যন্ত নির্ভুলভাবে মোট জমি, বিভিন্ন হোল্ডিং অনুযায়ী কর্তন এবং অবশিষ্ট জমির অটোমেটেড হিসাব প্রস্তুত করা যায়।

---

## 📁 Project Architecture

The codebase follows a clean, modular folder hierarchy separating markup, styling, JavaScript logic, PWA service workers, and media assets:

```
landDeductionTable/
├── 📄 index.html            # Primary application entry point (LMAP official header/footer)
├── 🎨 css/
│   └── 📄 styles.css        # Design tokens, themes (Aurora Light/Dark), over-deduction & progress bar CSS
├── ⚡ js/
│   └── 📄 app.js            # Math engine, Excel exporter with official headers/footers, PWA handlers & LocalStorage
├── ⚙️ sw.js                 # PWA Service Worker for 100% offline caching
├── 📱 manifest.json        # Web App Manifest for LMAP mobile installation
├── 🖼️ assets/
│   ├── 🖼️ logo.svg          # LMAP Brand vector logo asset
│   └── 🖼️ devImage.jpeg     # Developer avatar image asset
└── 📝 README.md             # Official project documentation & reference guide
```

---

## ✨ Key Features (v4.5 Release)

### 📋 1. Official Header & Footer Integration (Print & Excel Export)
* **Print Copy Header/Footer**: Includes full project scope, Ministry of Land, UNDP Bangladesh, official slogan, LMAP branding, and copyright details on printed documents.
* **Identical Excel (.xlsx) Structure**: Generated `.xlsx` spreadsheets feature the exact same official header, holding metadata, totals, and credit footer as the print preview.

### 📊 2. Real-Time & Saved Cards Visual Plot Progress Bar
* **Real-Time Keystroke Calculation**: Displays an animated gradient progress bar comparing **Deducted Land %** vs **Remaining Land %** in real-time as users type.
* **Compact Saved Cards Indicator**: Renders a sleek mini ratio bar on every saved holding card row (`.mini-plot-progress-bar`).

### ⚠️ 3. Over-Deduction Neon Warning System
* **Automatic Over-Deduction Alert**: Detects if total deduction exceeds total plot land area and highlights the row in glowing neon red with a `⚠️ অতি-কর্তন!` alert badge.

### 📲 4. Progressive Web App (PWA) & 100% Offline Mobile Operation
* **Add to Home Screen**: Installable as a standalone native app on Android, iOS, and Desktop devices with `manifest.json`.
* **Service Worker Caching (`sw.js`)**: Runs 100% offline in rural areas with zero internet connectivity.

### 📱 5. Mobile-First Touch Optimization
* Enlarged touch target heights (min 44px) for effortless mobile operation, smooth horizontal table scrolling, and touch-friendly controls.

---

## ⚡ Tech Stack & Libraries

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 / CSS3 Tokens | Modular components, CSS variables, glassmorphism, responsive grid |
| **Logic & Math** | JavaScript (ES6+) | Precise decimal arithmetic engine & Bangla digit parsing (`BN_DIGITS`) |
| **Offline App** | PWA Service Worker | Caches shell & assets for 100% offline availability |
| **Spreadsheets** | SheetJS (`xlsx.full.min.js`) | Client-side `.xlsx` workbook & worksheet compilation with official headers |

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
*Project:* **LMAP** (*Land Management Automation Project*)

</div>

---

## 📜 License

© 2026 **Land Management Automation Project (LMAP)** · **Ministry of Land & UNDP Bangladesh** · All Rights Reserved.  
*জনবান্ধব ভূমিসেবা অটোমেশন — স্বচ্ছতার সাথে ভূমিসেবা সহজেই*
