# WHIPPIN Mobile — one-time setup

WHIPPIN Mobile is a Progressive Web App served by Cloudflare Workers. The Discord bot token stays in Worker secrets and is never sent to the browser.

## Cloudflare deployment
1. Create a free Cloudflare account and an API token with Workers Scripts: Edit and Account Settings: Read permissions.
2. In GitHub repository Settings → Secrets and variables → Actions, add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.
3. Run Actions → Deploy WHIPPIN Mobile. The first deployment prints the workers.dev URL.

## Discord OAuth
1. In Discord Developer Portal, select the application that owns the WHIPPIN bot.
2. Under OAuth2 → General → Redirects, add https://whippin-mobile.YOUR-SUBDOMAIN.workers.dev/auth/callback (replace YOUR-SUBDOMAIN with the Cloudflare URL shown after deployment).
3. Copy Application ID and Client Secret.
4. Add GitHub Actions secrets: DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN, ADMIN_DISCORD_USER_ID (your numeric Discord user ID), and WHIPPIN_SESSION_SECRET (random value, at least 32 characters).
5. Run Deploy WHIPPIN Mobile again to upload encrypted Worker secrets.

## iPhone
Open https://whippin-mobile.YOUR-SUBDOMAIN.workers.dev/mobile.html in Safari, sign in with the configured Discord account, enter a server ID where the bot is installed, then tap Share → Add to Home Screen.

Only the configured Discord account can sign in. The bot needs relevant permissions in the target server.