# MK ApertaCodex AI

> Access your AI-powered markdown knowledge base at [mk.apertacodex.ai](https://mk.apertacodex.ai/) directly inside VS Code.

## Features

- **Integrated Sidebar Panel** — A dedicated Activity Bar icon opens the MK ApertaCodex AI web app in a persistent sidebar webview.
- **Toolbar Navigation** — Back, Forward, Home, Reload, and Open-in-Browser controls built into the panel header.
- **URL Tracking** — The current URL is displayed and tracked, so you always know where you are.
- **Remember Last Page** — Optionally restore the last visited page when you reopen VS Code.
- **Open in Browser** — One-click to pop the current page into your default browser.
- **Copy URL** — Instantly copy the current page URL to your clipboard.
- **Status Bar Indicator** — See at a glance whether the panel is connected, loading, or has an error.
- **Error Recovery** — Friendly error screen with retry and open-in-browser options if connectivity fails.
- **Configurable Base URL** — Point the extension at any deployment of the MK app.

## Installation

1. Install from the VS Code Marketplace or build from source (see below).
2. Click the **MK ApertaCodex AI** icon in the Activity Bar (left sidebar).
3. The web app loads automatically.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+M` / `Cmd+Shift+M` | Open / Focus the MK panel |
| `Ctrl+Shift+R` / `Cmd+Shift+R` | Refresh the panel (when focused) |

## Commands

All commands are available via the Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---|---|
| `MK ApertaCodex: Open MK ApertaCodex AI` | Focus the sidebar panel |
| `MK ApertaCodex: Refresh` | Reload the current page |
| `MK ApertaCodex: Go to Home` | Navigate to the base URL |
| `MK ApertaCodex: Open in Browser` | Open current URL in default browser |
| `MK ApertaCodex: Copy URL` | Copy current URL to clipboard |

## Configuration

Open **Settings** (`Ctrl+,`) and search for `MK ApertaCodex`:

| Setting | Default | Description |
|---|---|---|
| `mkApertacodex.baseUrl` | `https://mk.apertacodex.ai/` | Base URL for the application |
| `mkApertacodex.autoLoad` | `true` | Auto-focus the panel on startup |
| `mkApertacodex.rememberLastPage` | `true` | Restore last visited page on reload |
| `mkApertacodex.showStatusBar` | `true` | Show status indicator in the status bar |

## Marketplace Icon

If the extension icon is not visible in the marketplace, you need to ensure `images/icon.png` is a **real PNG file** (not a renamed JPEG or data URI). Run the helper script for guidance:

```bash
npm run generate-icon
```

The icon must be:
- At least **128×128 pixels** (256×256 recommended)
- A valid **PNG** file format
- Saved at `images/icon.png`

## Building from Source

```bash
npm install
npm run compile
```

Or use the Makefile:

```bash
make install   # compile, package, and install into VS Code & Cursor
make publish   # publish to VS Code Marketplace
```

## Requirements

- VS Code 1.108.0 or later
- Internet access to reach `mk.apertacodex.ai`

## License

MIT © ApertaCodex
