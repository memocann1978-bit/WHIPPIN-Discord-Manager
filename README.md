# WHIPPIN — Discord Server Manager

A premium Windows desktop control panel for managing Discord server structure through the official Discord Bot API.

## Features
- Official Discord bot connection (no user-token/self-bot support).
- Server structure, channel, category and role management.
- Channel permission editor, bulk operations and server templates.
- Activity history for management actions.
- Encrypted local bot-token storage through Electron safeStorage.
- In-app update checks, background downloads and restart-to-install.

## Install
Download the latest **WHIPPIN-Setup** installer from [GitHub Releases](https://github.com/memocann1978-bit/WHIPPIN-Discord-Manager/releases/latest) and install it once.

After the first installation, future versions are delivered from inside WHIPPIN:
1. Open **Settings**.
2. Select **Check for updates** (WHIPPIN also checks on startup and every six hours).
3. If an update is found, it downloads in the background.
4. When the download finishes, choose **Restart & install**. The installer applies the update and keeps the normal app installation.

## Release / update pipeline
The Windows Build GitHub Actions workflow:
- Runs on pushes to application source/configuration and on manual dispatch.
- Assigns a unique `0.2.<run number>` version to each build.
- Builds the Windows x64 NSIS installer.
- Uses the repository's `GITHUB_TOKEN` to publish the installer, `latest.yml`, and blockmap to a GitHub Release.
- `electron-updater` reads the release metadata from the public WHIPPIN repository.

To publish a new version, push application changes to `main` (or run **Windows Build** manually from the Actions tab). Do not manually upload or rename update files. The workflow must retain `contents: write` permission.

## Development
Requires Node.js 20+.

```bash
npm install
npm run dev
npm run dist:win
```

## Security
WHIPPIN uses an official Discord bot added to a server with only the permissions required for the selected management tasks. Never paste a personal Discord user token into this application. Bot credentials are encrypted locally using Electron safeStorage and are not committed to this repository.

The updater downloads release metadata and installer assets from the official public WHIPPIN GitHub repository over HTTPS. Keep the repository public for anonymous update checks to work.
