# Professional Digital Flipbook Library Web App

A production-ready digital library web application designed to host, stream, and render large PDF publications (optimized for 300–500 MB files) with high performance, smooth dual-page magazine flipbook transitions on desktop, responsive single-page swipe controls on mobile, and zero full-file download lag.

---

## 🚀 Key Architecture & Performance Highlights

- **HTTP Byte-Range Streaming**: Uses Mozilla PDF.js configured with `disableAutoFetch: true`, `disableStream: false`, and `rangeChunkSize: 65536` (64KB chunks). It retrieves only the required portions of the PDF on-demand instead of buffering hundreds of megabytes into memory.
- **Memory-Conscious Canvas Management**: Destroys canvas elements and cleans up page proxies outside the active viewport window to prevent browser crashes on mobile and low-memory devices.
- **Virtualized Lazy Thumbnails**: Utilizes `IntersectionObserver` to render thumbnail canvases only when they scroll into view at low scale (0.18x), preventing render congestion on large documents.
- **Realistic Magazine Spread**: Desktop two-page spread with book spine lighting divider and soft page drop-shadows; single-page mode on mobile with swipe and pinch-to-zoom gestures.
- **In-Document Full-Text Search**: Incremental text extraction across pages with search highlights, occurrence counting, and jump-to-page navigation.
- **Reading Progress Persistence**: Automatically remembers the user's last-read page in `localStorage` per publication and offers a *"Resume reading from page X?"* prompt.
- **Supabase PostgreSQL Database**: Complete schema with Row Level Security (RLS) policies, indexes, and automated timestamp triggers. Includes 25 pre-configured publications with rich metadata.
- **Cloudflare R2 Ready**: Secure storage architecture where PDFs are streamed directly from R2 without exposing private API keys or access credentials to client browsers.
- **Cloudflare Pages SPA Deployment**: Includes `public/_redirects` (`/* /index.html 200`) and `public/_headers` with CORS and byte-range exposure headers for seamless direct URL navigation and page refreshes.

---

## 📁 Project Structure

```text
Flipbook/
├── public/
│   ├── _redirects                  # Cloudflare Pages SPA rewrite rule
│   ├── _headers                    # Security & Range/CORS headers
│   └── ...
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx          # Navigation, brand logo, status badge
│   │   │   ├── Footer.tsx          # Architecture highlights & tech stack
│   │   │   ├── SEO.tsx             # Dynamic metadata, OG tags, canonical links
│   │   │   └── LoadingScreen.tsx   # Progressive range-loading & error handling
│   │   ├── home/
│   │   │   ├── Hero.tsx            # Hero banner with real-time catalog statistics
│   │   │   ├── BookCard.tsx        # Magazine card with cover preview & badges
│   │   │   ├── BookGrid.tsx        # Responsive grid with skeletons & empty states
│   │   │   └── FilterBar.tsx       # Live search & category filters
│   │   ├── pdf/
│   │   │   ├── FlipbookViewer.tsx  # Dual/Single page viewer orchestrator
│   │   │   ├── PdfPageCanvas.tsx   # Memory-managed high-DPI canvas renderer
│   │   │   ├── PdfToolbar.tsx      # Top & bottom floating control bars
│   │   │   ├── PdfThumbnails.tsx   # Virtualized lazy thumbnail drawer
│   │   │   ├── PdfSearchModal.tsx  # In-viewer text search with match highlights
│   │   │   └── ResumePrompt.tsx    # "Continue reading" overlay toast
│   │   └── admin/
│   │       ├── AdminLayout.tsx     # Header & sidebar for admin operations
│   │       ├── BookTable.tsx       # Publication management table
│   │       ├── BookFormModal.tsx   # Add/Edit publication modal form
│   │       └── R2GuideModal.tsx    # Interactive Cloudflare R2 setup instructions
│   ├── hooks/
│   │   ├── useBooks.ts             # Supabase publication collection hook
│   │   ├── useBookBySlug.ts        # Individual publication loader
│   │   ├── usePdfDocument.ts       # Byte-range PDF.js document loader
│   │   ├── usePdfSearch.ts         # Incremental text search hook
│   │   └── useReadingProgress.ts   # Local reading memory hook
│   ├── lib/
│   │   ├── config.ts               # Viewer settings & helper utilities
│   │   ├── pdfjs.ts                # PDF.js Web Worker & streaming task setup
│   │   ├── storage.ts              # LocalStorage reading memory manager
│   │   └── supabase.ts             # Supabase client & 25 seed publications
│   ├── types/
│   │   └── book.ts                 # TypeScript types
│   ├── pages/
│   │   ├── HomePage.tsx            # Public publication library catalog
│   │   ├── BookViewerPage.tsx      # Full-screen reader route (/book/:slug)
│   │   ├── AdminDashboardPage.tsx  # Admin management dashboard (/admin)
│   │   └── AdminLoginPage.tsx      # Authentication screen (/admin/login)
│   ├── index.css                   # Tailwind CSS styling & book shadows
│   ├── App.tsx                     # React Router routes
│   └── main.tsx
├── supabase/
│   └── schema.sql                  # PostgreSQL table, indexes, RLS, triggers & 25 seed books
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables (Optional for local demo)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_PDF_CDN_URL=https://pub-your-r2-subdomain.r2.dev/books/
```

> **Note**: The application has an automatic local dataset fallback. You can run and test all 25 sample books, reader features, and admin operations immediately even before configuring Supabase!

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:5173/` in your browser.

### 4. Build for Production

```bash
npm run build
```

The production bundle will be output to `dist/`.

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase Dashboard.
3. Open [`supabase/schema.sql`](file:///c:/Users/Admin/Desktop/Flipbook/supabase/schema.sql) and execute the SQL script.
4. This will create:
   - The `books` table with all metadata fields and constraints
   - Fast B-Tree indexes on `slug`, `category`, `book_number`, and `is_published`
   - Automatic `updated_at` trigger
   - Row Level Security (RLS) policies:
     - Public users can read `is_published = true`
     - Authenticated users can Create, Read, Update, and Delete all publications
   - 25 seed publications ready to browse and read!
5. To create your first admin user, go to **Authentication** → **Users** → **Add User** (enter email & password).

---

## ☁️ Cloudflare R2 Bucket & Large PDF Setup

Cloudflare R2 provides S3-compatible object storage with **$0 egress fees**, making it ideal for 300–500 MB PDFs.

### Step 1: Create R2 Bucket
1. In the Cloudflare Dashboard, go to **R2 Object Storage** → **Create bucket**.
2. Name your bucket (e.g. `digital-library-books`).

### Step 2: Configure CORS Policy (Crucial for Byte-Range Streaming)
1. Go to your bucket's **Settings** → **CORS Policy**.
2. Add the following CORS configuration:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["Range", "Content-Range", "Content-Type", "Accept-Ranges"],
    "ExposeHeaders": ["Content-Length", "Content-Range", "Accept-Ranges"],
    "MaxAgeSeconds": 3600
  }
]
```

### Step 3: Enable Public Access or Connect Custom Domain
1. In bucket **Settings** → **Public Access**, enable **R2.dev subdomain** or attach your custom domain (e.g. `cdn.yourlibrary.com`).
2. Upload your compressed PDFs (e.g., `book-01.pdf`, `book-02.pdf`, ..., `book-25.pdf`).

### Step 4: Verify Byte-Range Requests with cURL
Run this command in your terminal to verify that your R2 URL responds with `HTTP 206 Partial Content`:

```bash
curl -I -H "Range: bytes=0-65535" https://your-r2-domain.com/books/book-01.pdf
```

Expected response headers:
```text
HTTP/2 206
accept-ranges: bytes
content-range: bytes 0-65535/354829100
content-length: 65536
```

---

## 🌐 Cloudflare Pages SPA Deployment

1. Push your repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build output directory**: `dist`
4. Add Environment Variables in Cloudflare Pages:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Save and Deploy**.
6. The `public/_redirects` file automatically handles client-side routing so URLs like `/book/annual-report-2026` or `/admin` work on direct entry and page refresh.

---

## 📖 How to Add Book 26 Later

1. **Prepare PDF**: Compress your PDF if needed (target under 400 MB).
2. **Upload to R2**: Upload `book-26.pdf` to your Cloudflare R2 bucket and copy its public URL.
3. **Upload Cover**: Upload `book-26.webp` (recommended size: 800x1067px).
4. **Add via Admin Dashboard**:
   - Log in at `https://your-domain.com/admin`
   - Click **+ Add Publication**
   - Fill in Title, Slug (`book-26` or `your-publication-name`), Category, Author, Cover URL, and R2 PDF URL
   - Check **Publish immediately** and click **Save Publication**
5. **View Live**: Your publication is instantly available at `https://your-domain.com/book/book-26` and featured on the homepage!

---

## ⌨️ Keyboard Shortcuts in Viewer

- `←` / `PageUp` : Previous Page
- `→` / `PageDown` / `Space` : Next Page
- `+` / `=` : Zoom In
- `-` / `_` : Zoom Out
- `F` : Toggle Fullscreen
- `Esc` : Exit Fullscreen / Close Sidebars

---

## 🛡️ License

MIT License. Engineered for ultra-high performance digital publications.
