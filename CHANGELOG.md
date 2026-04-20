# Changelog

All notable changes to **MK ApertaCodex AI** will be documented in this file.

## [0.0.7] - Icon & Status Bar Fix

### Fixed
- **Fixed marketplace icon not displaying** — `images/icon.png` was a JPEG data URI string instead of a real PNG file. Added `generate-icon` script with instructions to create a proper 128x128+ PNG icon.
- **Fixed Activity Bar icon** — `resources/icon.svg` was a base64 data URI instead of actual SVG markup. Replaced with proper inline SVG.

### Added
- **Status Bar Indicator** — Shows the current state of the MK panel (loading, connected, error, idle) in the VS Code status bar. Click to open the panel.
- **`mkApertacodex.showStatusBar` setting** — Toggle the status bar indicator on/off.
- **`generate-icon` npm script** — Helper to validate or guide creation of the marketplace PNG icon.
- Webview now sends `loadError` message on timeout, enabling proper error state in status bar.

## [0.0.6]

### Changed
- Various improvements

## [0.0.4] - Command Prefix Fix

### Fixed
- Renamed all commands from `myext.*` to `mk-apertacodex.*` to follow proper extension naming conventions
- Updated webview view ID from `myext.mkView` to `mk-apertacodex.mkView`
- Updated all menu `when` clauses to reference the new view ID
- Updated all keybinding references to use new command IDs
- Updated auto-focus command to use new view focus ID

## [0.0.3]

### Added
- Various improvements and fixes

## [0.0.1] - Initial Release

### Added
- Sidebar webview panel wrapping `https://mk.apertacodex.ai/`
- Activity Bar icon with dedicated `mk-apertacodex` view container
- Toolbar with Back, Forward, Home, Reload, and Open-in-Browser buttons
- URL tracking and display in the toolbar
- Remember last visited page (configurable)
- Auto-load on startup (configurable)
- Commands: Open Panel, Refresh, Go Home, Open External, Copy URL
- Keyboard shortcuts: `Ctrl+Shift+M` (open), `Ctrl+Shift+R` (refresh)
- Error screen with retry and open-in-browser options if connectivity fails
- Loading progress bar animation
- Configuration: `baseUrl`, `autoLoad`, `rememberLastPage`
- Output channel logging for diagnostics
