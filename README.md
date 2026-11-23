# WHIPPIN — Discord Server Manager

A premium desktop control panel for managing Discord server structure through the official Discord Bot API.

## Current milestone
- Premium dashboard shell and navigation
- Electron desktop wrapper with renderer isolation
- Windows installer workflow via GitHub Actions

## Build
Requires Node.js 20+.

```bash
npm install
npm run dev
npm run dist:win
```

## Security
WHIPPIN will use an official Discord bot added to a server with only the permissions required for the selected management tasks. Never paste a personal Discord user token into this application. Bot credentials must be stored securely and must never be committed to this repository.

## Roadmap
1. Dashboard and application shell
2. Official bot connection and guild discovery
3. Categories and channel management
4. Role management
5. Permission editor
6. Templates, bulk actions, audit history
