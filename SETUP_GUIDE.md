# 🚀 Flipbook Pro - Complete Step-by-Step Setup Guide

This guide explains how to use the app **locally immediately without creating any accounts**, followed by detailed, beginner-friendly instructions on setting up free accounts for **Cloudflare R2** (PDF storage), **Supabase** (Database), and **Cloudflare Pages** (Free Web Hosting).

---

## 📑 Table of Contents
1. [⚡ Quick Start: Run Locally With Zero Accounts Needed](#1--quick-start-run-locally-with-zero-accounts-needed)
2. [📦 Part 1: Cloudflare R2 Setup (Free 10 GB PDF Storage)](#2--part-1-cloudflare-r2-setup-free-10-gb-pdf-storage)
3. [🗄️ Part 2: Supabase Setup (Free Database for Metadata)](#3--part-2-supabase-setup-free-database-for-metadata)
4. [🌐 Part 3: Cloudflare Pages Setup (Free Web Deployment)](#4--part-3-cloudflare-pages-setup-free-web-deployment)
5. [📖 Part 4: How to Add & Share Publications](#5--part-4-how-to-add--share-publications)

---

## 1. ⚡ Quick Start: Run Locally With Zero Accounts Needed

You do **not** need any third-party accounts or API keys to start reading and testing the app right now! The app includes:
* ✅ 25 pre-loaded sample publications with covers, metadata, and working PDFs.
* ✅ Built-in offline demo database fallback.
* ✅ One-click Instant Demo Admin access.

### How to Run Locally:
1. Open terminal in the project directory:
   ```bash
   cd c:\Users\Admin\Desktop\Flipbook
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open your browser:
   * **Public Direct Links**:
     * `http://localhost:5173/book/01` (Book 1)
     * `http://localhost:5173/book/02` (Book 2)
     * `http://localhost:5173/book/25` (Book 25)
   * **Admin Hub**:
     * `http://localhost:5173/admin`
     * *(Click **"Instant Demo Admin Access"** to enter without credentials)*

---

## 2. 📦 Part 1: Cloudflare R2 Setup (Free 10 GB PDF Storage)

Cloudflare R2 is ideal for storing 300–500 MB PDFs because **Cloudflare charges $0.00 for data egress (download bandwidth)**. The free tier gives you **10 GB of storage for free every month**.

### Step 1: Create a Free Cloudflare Account
1. Visit [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. Enter your email and password to create an account.
3. Verify your email address.

### Step 2: Create an R2 Bucket
1. In the Cloudflare dashboard left sidebar, click on **R2 Object Storage**.
2. Click **Create bucket**.
3. Name your bucket: `flipbook-pdfs` (or any name you prefer).
4. Select location: **Automatic** (or closest region).
5. Click **Create Bucket**.

### Step 3: Enable Public Access for Your Bucket
1. In your bucket settings, go to the **Settings** tab.
2. Scroll down to **Public Access**.
3. Under **R2.dev subdomain**, click **Allow Access**.
4. Type `allow` in the confirmation box and confirm.
5. Cloudflare will give you a public URL (e.g. `https://pub-xxxxxxxxxxxx.r2.dev`).

### Step 4: Configure CORS (Crucial for Range Chunk Streaming)
To allow the PDF viewer to stream large 300–500 MB PDFs in 64 KB chunks without downloading the whole file:
1. In the same **Settings** tab, scroll to **CORS Policy**.
2. Click **Add CORS policy** and paste this exact JSON:

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Range",
      "Content-Type",
      "Origin",
      "Accept"
    ],
    "ExposeHeaders": [
      "Accept-Ranges",
      "Content-Range",
      "Content-Length",
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```
3. Click **Save**.

### Step 5: Upload Your PDF Files
1. Go to the **Objects** tab in your bucket.
2. Click **Upload** -> **Upload files**.
3. Upload your PDF files (e.g. `book-01.pdf`, `book-02.pdf`, etc.).
4. Click on the uploaded file and copy its **Public URL** (e.g. `https://pub-xxxxxxxxxxxx.r2.dev/book-01.pdf`).

---

## 3. 🗄️ Part 2: Supabase Setup (Free Database for Metadata)

Supabase provides a free PostgreSQL database to store publication titles, slugs, and R2 PDF URLs.

### Step 1: Create a Free Supabase Account
1. Visit [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with GitHub or your email.

### Step 2: Create a New Project
1. Click **New Project**.
2. Name: `Flipbook Library`.
3. Set a strong database password.
4. Select the region closest to your users.
5. Click **Create new project** (takes ~1 minute to spin up).

### Step 3: Create the Database Table & Seed Data
1. In the left sidebar of your Supabase dashboard, click **SQL Editor**.
2. Click **New query**.
3. Open the file [`supabase/schema.sql`](file:///c:/Users/Admin/Desktop/Flipbook/supabase/schema.sql) in this repository, copy the entire SQL script, and paste it into the Supabase SQL editor.
4. Click **Run** (or press Ctrl+Enter).
5. This creates the `books` table, security policies, and 25 seed records automatically.

### Step 4: Get Your Supabase Keys & Update `.env`
1. In Supabase, click **Project Settings** (gear icon at the bottom of the left sidebar) -> **API**.
2. Copy:
   * **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   * **anon public key** (e.g. `eyJhbGciOi...`)
3. In your project root, copy `.env.example` to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

---

## 4. 🌐 Part 3: Cloudflare Pages Setup (Free Web Deployment)

Cloudflare Pages hosts your React frontend on a worldwide edge network for free with unlimited bandwidth.

### Option A: Direct Deployment via Git (Recommended)
1. Push this project to your GitHub/GitLab account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Flipbook Pro"
   git branch -M main
   git remote add origin https://github.com/your-username/flipbook.git
   git push -u origin main
   ```
2. Log into [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Workers & Pages**.
3. Click **Create application** -> **Pages** -> **Connect to Git**.
4. Select your `flipbook` repository.
5. Set the Build settings:
   * **Framework preset**: `Vite`
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
6. Under **Environment variables**, add:
   * `VITE_SUPABASE_URL` = *(Your Supabase URL)*
   * `VITE_SUPABASE_ANON_KEY` = *(Your Supabase Anon Key)*
7. Click **Save and Deploy**.

*(Note: The SPA routing rule in `public/_redirects` and CORS headers in `public/_headers` are automatically included in the build).*

---

## 5. 📖 Part 4: How to Add & Share Publications

### How to Add a New PDF:
1. Open your Admin Dashboard: `/admin`.
2. Click the green **"Add New PDF"** button in the top right.
3. In the simplified popup modal:
   * Enter the **Publication Title** (e.g. *Q3 Financial Overview 2026*).
   * Either **Paste the R2 PDF URL** OR **Select a PDF file** from your computer.
4. Click **"Add Publication"**.

### How to Share with Public Readers:
1. In the Admin Dashboard table, find your publication.
2. Click the **"Copy /book/01"** button.
3. Send that link to your reader or client.
4. When they open it, it launches directly into the high-performance **Continuous Vertical Scroller** flipbook reader with full privacy (no other documents visible).

---

## 💡 Summary of Free Tier Limits

| Provider | Service | Free Tier Allowance |
| :--- | :--- | :--- |
| **Cloudflare R2** | PDF Storage | **10 GB Storage / Month**, **$0 Egress Bandwidth Fees** |
| **Supabase** | PostgreSQL Database | **500 MB Database**, **50,000 Monthly Active Users** |
| **Cloudflare Pages** | Web Hosting | **Unlimited Bandwidth**, **500 Builds / Month**, **Free SSL** |

*Everything in this stack is 100% free within these generous quotas.*
