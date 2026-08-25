<div align="center">

# 🌾 জমি কর্তন টেবিল (Land Deduction Table - LMAP)

[![Version](https://img.shields.io/badge/Version-v4.5-6E56FF?style=for-the-badge&logo=appveyor)](https://github.com/shahriyarshehab/landDeductionTable)
[![Status](https://img.shields.io/badge/Status-Enterprise%20Ready-12B8A3?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Backend](https://img.shields.io/badge/API%20Server-Render.com-46E3B7?style=for-the-badge&logo=render)](https://render.com)
[![Hosting](https://img.shields.io/badge/Hosting-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Copyright%20©%202026-C9922B?style=for-the-badge)](https://github.com/shahriyarshehab/landDeductionTable)

<br/>

**Land Data Digitalization for Inclusive Growth (LDD4IG)**  
*সঠিক পরিমাপ ও অন্তর্ভুক্তিমূলক প্রবৃদ্ধিতে স্মার্ট ডিজিটাল ভূমিসেবা*

[🚀 Quick Start](#-quick-start) • [☁️ Cloud Deployment Guide](#%EF%B8%8F-cloud-server--database-deployment-guide) • [✨ Enterprise Features](#-key-enterprise-features) • [📁 Directory Structure](#-project-architecture)

</div>

---

> [!IMPORTANT]
> **LMAP (Land Management Automation Project)** হলো ভূমি জরিপ, খতিয়ান ব্যবস্থাপনা এবং দাগ-ভিত্তিক জমির কর্তন হিসাব রিয়েল-টাইমে পরিচালনার জন্য তৈরি একটি আধুনিক, স্ট্রিক্ট-প্রাইভেসি এনক্রিপ্টেড ওয়েব অ্যাপ্লিকেশন। অ্যাপটিতে **Supabase PostgreSQL Cloud DB**, **Render.com Node.js API** এবং **Vercel Frontend Hosting** আর্কিটেকচার যুক্ত করা হয়েছে।

---

## ☁️ Cloud Server & Database Deployment Guide

LMAP সিস্টেমকে ক্লাউডে সম্পূর্ণ বিনামূল্যে (১০০% Free Tier) লাইভ করার জন্য নিচের ৩টি প্রধান ধাপ অনুসরণ করুন:

```
+-------------------------------------------------------------------+
|               LMAP Web Client (Hosted on Vercel)                  |
|                 https://your-lmap.vercel.app                      |
+-------------------------------------------------------------------+
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Render.com REST API Server ]                    [ Supabase Cloud DB ]
  Node.js + Express.js API                         PostgreSQL + Row-Level Security
  (https://lmap-api.onrender.com)                  (SHA-256 Auth & Data Sync)
```

---

### 🗄️ ১. Supabase ক্লাউড ডাটাবেজ সেটআপ (Supabase PostgreSQL Setup)

1. [Supabase.com](https://supabase.com)-এ ফ্রি একাউন্ট তৈরি করুন এবং **New Project** দিয়ে প্রজেক্ট খুলুন।
2. Supabase ড্যাশবোর্ডের **SQL Editor**-এ গিয়ে নিচের SQL স্ক্রিপ্টটি রান করুন:

```sql
-- 1. Users Database Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'DMF',
    office VARCHAR(200) DEFAULT 'উপজেলা ভূমি অফিস',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Holdings Database Table
CREATE TABLE IF NOT EXISTS public.holdings (
    id VARCHAR(100) PRIMARY KEY,
    holding_no VARCHAR(100) NOT NULL,
    khatian VARCHAR(100),
    area_unit VARCHAR(50) DEFAULT 'shotok',
    dag_rows JSONB NOT NULL,
    korton_cols JSONB,
    created_by JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    action_name VARCHAR(100) NOT NULL,
    user_name VARCHAR(150),
    user_role VARCHAR(50),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
```

3. Supabase-এর **Project Settings -> API** সেকশন থেকে `Project URL` এবং `anon key` কপি করুন।

---

### ⚙️ ২. Render.com ব্যাকএন্ড API ডেপ্লয়মেন্ট (Render.com API Setup)

1. [Render.com](https://render.com)-এ লগইন করে **New Web Service** অপশনে ক্লিক করুন।
2. আপনার গিটহাব রিপোজিটরি কানেক্ট করুন এবং নিচের সেটিং দিন:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. **Environment Variables**-এ নিচের মানগুলো দিন:
   - `SUPABASE_URL` = `https://your-project.supabase.co`
   - `SUPABASE_KEY` = `your-supabase-service-key`
   - `PORT` = `10000`
4. **Deploy Web Service** বাটনে ক্লিক করুন। কয়েক সেকেন্ডের মধ্যে আপনার API ইউআরএল পেয়ে যাবেন (যেমন: `https://lmap-api.onrender.com`)।

---

### 🌐 ৩. Vercel ফ্রন্টএন্ড হোস্টিং (Vercel Deployment)

1. [Vercel.com](https://vercel.com)-এ সাইন আপ করে **Add New Project** ক্লিক করুন।
2. আপনার GitHub রিপোজিটরি `landDeductionTable` সিলেক্ট করুন।
3. **Deploy** বাটনে ক্লিক করুন।
4. কয়েক সেকেন্ডের মধ্যে আপনার লাইভ ওয়েবসাইট ইউআরএল তৈরি হয়ে যাবে (যেমন: `https://land-deduction-table.vercel.app`)!

---

## ✨ Key Enterprise Features

### 🔒 1. Strict Privacy & SHA-256 Cryptographic Security
* **User Data Isolation**: সাধারণ ইউজার (`Operator`, `DMF`, `Land Officer`) শুধুমাত্র তার নিজস্ব এন্ট্রি করা তথ্য দেখতে ও পরিচালনা করতে পারেন।
* **SHA-256 Hashing**: Web Crypto API ব্যবহার করে পাসওয়ার্ড এনক্রিপ্ট করে সিকিউর সেশনে সংরক্ষণ করা হয়।

### 📊 2. Visual Land Data Analytics & Audit Log
* **অ্যানালিটিক্স প্যানেল**: মোট হোল্ডিং, মোট খতিয়ান, ক্যাডাস্ট্রাল দাগ, মোট কর্তনকৃত জমি এবং অবশিষ্ট জমির শতকরা হার পরিমাপের ভিজ্যুয়াল সামারি।
* **সিকিউরিটি অডিট লগ**: ইউজারদের সকল সিস্টেম কার্যক্রম তারিখ ও সময়সহ ট্র্যাকিং।

### 📥 3. System JSON Backup & Restore
* **১-ক্লিক ব্যাকআপ এক্সপোর্ট**: সমস্ত হোল্ডিং ও ইউজার ডাটার `.json` ব্যাকআপ পিসিতে নামানোর সুবিধা।
* **ব্যাকআপ রিস্টোর**: পুরনো ব্যাকআপ ফাইল থেকে ডাটা মুহূর্তের মধ্যে পুনরুদ্ধার।

### 📐 4. Universal Land Converter & SheetJS (.xlsx) Export
* শতক, কাঠা, বিঘা, একর, হেক্টর, কানি, গণ্ডা ও বর্গফুট রূপান্তরক এবং প্রিন্ট-রেডি এক্সেল ওয়ার্কশিট এক্সপোর্ট।

---

## ⚡ Tech Stack & Cloud Services

| Layer | Technology | Hosting / Cloud Provider |
| :--- | :--- | :--- |
| **Frontend UI** | HTML5 / CSS Tokens / JS (ES6+) | **Vercel** *(100% Free Hosting)* |
| **Backend API** | Node.js / Express REST API | **Render.com** *(Free Tier Web Service)* |
| **Database** | PostgreSQL + RLS | **Supabase** *(500 MB Free Cloud DB)* |
| **Spreadsheets** | SheetJS (`xlsx.full.min.js`) | Client-side `.xlsx` workbook compiler |

---

## 📁 Project Architecture

```
landDeductionTable/
├── 📄 index.html            # Application entry point with Auth, Analytics & Audit Modals
├── 🎨 css/
│   └── 📄 styles.css        # Enterprise tokens, glassmorphic themes, analytics & print rules
├── ⚡ js/
│   └── 📄 app.js            # App controller, SHA-256 Crypto Auth, Analytics & Cloud Config
├── 🖼️ assets/
│   └── 🖼️ devImage.jpeg     # Developer avatar asset
└── 📝 README.md             # Project documentation & Cloud Deployment Guide
```

---

## 👨‍💻 Developer & Facilitation

<div align="center">

<img src="./assets/devImage.jpeg" width="110" height="110" style="border-radius: 50%; object-fit: cover; box-shadow: 0 4px 14px rgba(110,86,255,0.3);" alt="Shahriyar Shehab">

### **Shahriyar Shehab**
**Data Management Facilitator (DMF)**  
*Project:* **LDD4IG** (*Land Data Digitalization for Inclusive Growth*)  
*Organizations:* **Ministry of Land • UNDP Bangladesh**

</div>

---

## 📜 License

© 2026 **LDD4IG Project** · All Rights Reserved.  
*স্মার্ট ভূমি সেবা, ডিজিটাল বাংলাদেশ।*e** is a pure client-side application, no backend server or Node.js build process is required!

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
