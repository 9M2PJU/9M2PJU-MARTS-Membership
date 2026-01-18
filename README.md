# MARTS Membership Web App

A modern, responsive web application for managing Malaysian Amateur Radio Transmitter's Society (MARTS) membership directory.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Data Update](https://github.com/9m2pju/9M2PJU-MARTS-Membership/actions/workflows/scrape.yml/badge.svg)

## Features

- 🔍 **Search & Filter** - Real-time search by callsign, name, or member ID
- 📊 **Multiple Filters** - Filter by prefix (9M/9W), expiry year/month, status
- 📱 **PWA Support** - Install as app on desktop and mobile
- 🌙 **Dark/Light Mode** - Toggle between themes
- 📤 **Export JSON** - Download membership data
- 💾 **Offline First** - Works without internet using local JSON data
- 🤖 **Automated Sync** - Weekly automated scraping of official MARTS data
- 📝 **Issue Ops Management** - Add/Delete members via GitHub Issues

## Architecture

This project uses a **GitOps** approach for data management:

1.  **Frontend**: Pure HTML/CSS/JS hosted on GitHub Pages.
2.  **Data Source**: `data/members.json` is the single source of truth.
3.  **Automation**:
    *   **Weekly Scraper**: A GitHub Action runs every Sunday to fetch the latest list from the official MARTS website.
    *   **Member Management**: Administrators can add or delete members by simply opening a GitHub Issue.

## Quick Start

### 1. View Live Site
Visit the [GitHub Pages Deployment](https://9m2pju.github.io/9M2PJU-MARTS-Membership/).

### 2. Run Locally
To test or develop locally:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/9M2PJU-MARTS-Membership.git
cd 9M2PJU-MARTS-Membership

# Install dependencies (only needed for scraper scripts)
npm install

# Serve locally
npx serve .
```

## Data Management

### Automatic Updates
The directory is automatically updated **every Sunday at 00:00 UTC** by the [Member Scraper workflow](.github/workflows/scrape.yml).

### Manual Management (Admins Only via GitHub)
**The web interface allows viewing only.** To add, edit, or delete members:

1.  Go to the **[Issues](../../issues/new/choose)** tab on GitHub.
2.  Select **Add New Member**, **Edit Member details**, or **Delete Member**.
3.  Fill out the form and submit.
4.  A GitHub Action will automatically process your request and update the directory within ~30 seconds.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Glassmorphism), JavaScript (ES6+)
- **Data**: JSON (stored in repo)
- **CI/CD**: GitHub Actions (Node.js)
- **PWA**: Service Worker for offline support

## File Structure

```
├── index.html          # Main HTML page
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── css/
│   └── style.css       # Styling
├── js/
│   ├── data.js         # Data layer (JSON + LocalStorage)
│   ├── filters.js      # Filter logic
│   └── app.js          # Main app logic
├── data/
│   └── members.json    # The Database (JSON)
├── scripts/
│   ├── scrape.js          # Web scraper script
│   └── manage_members.js  # Issue Ops processor
└── .github/
    ├── workflows/      # CI/CD pipelines
    └── ISSUE_TEMPLATE/ # Forms for data management
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
| 9W3 | Malaysia (All States) | C |

## License

MIT License - Feel free to use and modify!

## Credits

- Data source: [MARTS Official](https://ahli.marts.org.my)
- Malaysian Amateur Radio Transmitter's Society
