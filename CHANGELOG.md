# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-01-19

### Added
- **SWL Support**: Added dedicated logic and filter for Short Wave Listener (SWL) members.
- **Branding**: Added new MARTS logo to header and favicon.
- **Performance**:
    - Implemented Parallel Data Fetching (4x faster initial load).
    - Added Search Debouncing (improves responsiveness).
    - Memoized Member Cards (reduces re-renders).
    - Optimized images using `next/image`.
- **Navigation**: Added a floating "Back to Home" button for improved navigation on non-home pages.

### Fixed
- **Security**: Removed hardcoded credentials from scripts.
- **Mobile**: Fixed horizontal scrolling issues on filter buttons.
- **Reset**: Added "Home Reset" functionality by clicking the main title.

## [1.0.0] - 2026-01-15
- Initial Release
