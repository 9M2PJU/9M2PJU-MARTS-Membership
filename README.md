# MARTS Membership Web App

A modern, responsive web application for managing Malaysian Amateur Radio Transmitter's Society (MARTS) membership directory.

## Features

- 🔍 **Search & Filter** - Real-time search by callsign, name, or member ID
- 📊 **Multiple Filters** - Filter by prefix (9M/9W), expiry year/month, status
- ✏️ **CRUD Operations** - Add, edit, and delete members
- 🔄 **Sync from MARTS** - Pull latest data from official MARTS database
- 📱 **PWA Support** - Install as app on desktop and mobile
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📤 **Export JSON** - Download membership data
- 💾 **Offline Support** - Works without internet (cached data)

## Quick Start

### Option 1: Static Hosting (No Backend)
Simply host the files on any static server (GitHub Pages, Netlify, etc.)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/9M2PJU-MARTS-Membership.git
cd 9M2PJU-MARTS-Membership

# Serve locally
npx serve .
```

Open http://localhost:3000 in your browser.

### Option 2: With Supabase Backend (Recommended)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a free account and new project
   
2. **Create the Members Table**
   Run this SQL in Supabase SQL Editor:
   ```sql
   -- Create members table
   CREATE TABLE members (
     id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
     callsign TEXT NOT NULL,
     name TEXT NOT NULL,
     member_id TEXT NOT NULL,
     expiry TEXT,
     is_local BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create indexes for search
   CREATE INDEX idx_members_callsign ON members(callsign);
   CREATE INDEX idx_members_name ON members(name);
   CREATE INDEX idx_members_expiry ON members(expiry);

   -- Enable Row Level Security (optional)
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;

   -- Allow public read access (adjust as needed)
   CREATE POLICY "Allow public read" ON members
     FOR SELECT USING (true);

   -- Allow public insert/update/delete (for demo - restrict in production)
   CREATE POLICY "Allow public write" ON members
     FOR ALL USING (true);
   ```

3. **Configure the App**
   Edit `js/data.js` and replace the placeholder values:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```
   
   Find these values in: Supabase Dashboard > Settings > API

4. **Deploy to GitHub Pages**
   ```bash
   git add .
   git commit -m "Configure Supabase"
   git push origin main
   ```
   Enable GitHub Pages in repository settings.

## Usage

### Syncing Data from MARTS
1. Click the "🔄 Sync from MARTS" button
2. Wait for all 73 pages to be fetched (~2 minutes)
3. Data will be saved to Supabase (or localStorage)

### Managing Members
- **Add**: Click "➕ Add Member" button
- **Edit**: Click "✏️ Edit" on any member card
- **Delete**: Click "🗑️ Delete" on any member card

### Filters
- **Prefix**: 9M2, 9M4, 9M6, 9M8, 9W2, 9W4, 9W6, 9W8, 9M0, SWL, Foreign
- **Year**: Filter by expiry year
- **Month**: Filter by expiry month
- **Status**: Active, Expired, Expiring Soon (90 days)

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: Custom CSS with glassmorphism effects
- **Database**: Supabase (PostgreSQL) or localStorage fallback
- **PWA**: Service Worker for offline support
- **Fonts**: Inter from Google Fonts

## File Structure

```
├── index.html          # Main HTML page
├── manifest.json       # PWA manifest
├── sw.js              # Service worker
├── css/
│   └── style.css      # Glassmorphism styling
├── js/
│   ├── data.js        # Supabase/localStorage CRUD
│   ├── filters.js     # Filter logic
│   └── app.js         # Main app logic
├── data/
│   └── members.json   # Sample/fallback data
└── icons/             # PWA icons
```

## Callsign Prefixes

| Prefix | Region | Class |
|--------|--------|-------|
| 9M2 | Peninsular Malaysia | A |
| 9M4 | Peninsular Malaysia | A |
| 9M6 | Sabah | A |
| 9M8 | Sarawak | A |
| 9M0 | Special Event | - |
| 9W2 | Peninsular Malaysia | B |
| 9W4 | Peninsular Malaysia | B |
| 9W6 | Sabah | B |
| 9W8 | Sarawak | B |
| 9W3 | Special | B |

## License

MIT License - Feel free to use and modify!

## Credits

- Data source: [MARTS Official](https://ahli.marts.org.my)
- Malaysian Amateur Radio Transmitter's Society
