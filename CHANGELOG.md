# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-18

### Added
- **Issue Ops CMS**: Automated member management (Add/Edit/Delete) via GitHub Issues.
- **Automated Scraping**: Weekly cron job to fetch latest member data from MARTS website.
- **Offline Mode**: Application now uses local `data/members.json` as the primary data source.
- **Dynamic Scraper**: Improved scraper script to fetch all available records dynamically.

### Changed
- **Data Architecture**: Replaced Supabase backend with Git-backed JSON storage.
- **UI/UX**: Removed manual "Sync" button in favor of automated backend sync.
- **Documentation**: Updated README with architectural details and usage guide.

### Removed
- **Supabase Dependency**: Completely removed Supabase SDK and configuration.
