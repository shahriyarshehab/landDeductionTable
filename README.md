<div align="center">

# 🌾 জমি কর্তন টেবিল (Land Deduction Table - LDD4IG)

[![Version](https://img.shields.io/badge/Version-v4.4-6E56FF?style=for-the-badge&logo=appveyor)](https://github.com/shahriyarshehab/landDeductionTable)
[![Status](https://img.shields.io/badge/Status-Active-12B8A3?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Client--Side-33E0C7?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
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

The codebase follows a clean, modular folder hierarchy separating markup, styling, JavaScript logic, and media assets:

```
landDeductionTable/
├── 📄 index.html            # Primary application entry point (Clean HTML5 markup)
├── 🎨 css/
│   └── 📄 styles.css        # Design tokens, themes (Aurora Light/Dark), layout & print rules
├── ⚡ js/
│   └── 📄 app.js            # Precise decimal math engine, LocalStorage, SheetJS exporter & UI
├── 🖼️ assets/
│   └── 🖼️ devImage.jpeg     # Developer avatar image asset
└── 📝 README.md             # Project documentation & reference guide
```

---

## ✨ Key Features

### 🌅 1. Dual Theme System (Aurora Light & Dark Glassmorphic UI)
* **Sunrise & Sunset Mode**: Smooth animated theme toggle supporting light and dark color schemes built with CSS Custom Properties (Variables) and glassmorphism backdrop filters.

### 📊 2. Dynamic Holding Column Allocation & Smart Math Engine
* **Expression Parser**: Supports natural mathematical expressions directly inside deduction fields (e.g. `১+১+১`, `১.৫+২.০`, or `১.২, ৩.৪`).
* **Instant Column Split/Merge**: Automatically splits comma/plus separated deductions into individual holding columns or merges them into a single consolidated overview.

### 📐 3. Floating Universal Land Unit Converter Drawer
* Real-time converter supporting 8 standard measurement units: **Decimal (শতক), Katha (কাঠা), Bigha (বিঘা), Acre (একর), Hectare (হেক্টর), Kani (কানি), Ganda (গণ্ডা), and Square Feet (বর্গফুট)**.

### 📥 4. Advanced Spreadsheet Export (.xlsx)
* Integrated with **SheetJS (`xlsx.full.min.js`)** to generate print-ready Excel spreadsheets for individual holdings or complete bulk export worksheets.

### 🖨️ 5. Smart Print & PDF Engine
* **Auto-Orientation**: Dynamically switches between **A4 Portrait** (standard tables) and **A4 Landscape** (wide holding tables) for optimal printing without clipping data.

### 💾 6. Offline-First Storage Engine
* Built-in `LocalStorage` adapter guarantees zero-data loss, retaining saved holdings, custom tags, and developer profiles completely offline inside the client browser.

---

## ⚡ Tech Stack & Libraries

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 / CSS3 Tokens | Modular components, CSS variables, glassmorphism, responsive grid |
| **Logic & Math** | JavaScript (ES6+) | Precise decimal arithmetic engine & Bangla digit parsing (`BN_DIGITS`) |
| **Spreadsheets** | SheetJS (`xlsx.full.min.js`) | Client-side `.xlsx` workbook & worksheet compilation |
| **Typography** | Google Web Fonts | *Anek Bangla, Hind Siliguri, Tiro Bangla, Noto Serif Bengali, Inter* |

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

Since **Land Deduction Table** is a pure client-side application, no backend server or Node.js build process is required!

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/shahriyarshehab/landDeductionTable.git
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
