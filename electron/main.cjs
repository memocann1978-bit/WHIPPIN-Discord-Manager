const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const credentialPath = () => path.join(app.getPath('userData'), 'discord-credential.bin');
function saveToken(token) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows secure credential storage is unavailable.');
  fs.writeFileSync(credentialPath(), safeStorage.encryptString(token), { mode: 0o600 });
}
function readToken() {
  const p = credentialPath();
  if (!fs.existsSync(p)) throw new Error('Bot token is not saved. Connect your Discord bot first.');
  return safeStorage.decryptString(fs.readFileSync(p));
}
async function discord(pathname, options = {}) {
  const response = await fetch('https://discord.com/api/v10' + pathname, {
    ...options,
    headers: { Authorization: 'Bot ' + readToken(), 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || ('Discord API error ' + response.status));
  return body;
}
function registerDiscordHandlers() {
  ipcMain.handle('discord:connect', async (_event, { token, guildId }) => {
    if (typeof token !== 'string' || !token.trim() || typeof guildId !== 'string' || !/^\d{17,20}$/.test(guildId)) throw new Error('Enter a valid bot token and server ID.');
    const previous = fs.existsSync(credentialPath()) ? fs.readFileSync(credentialPath()) : null;
    saveToken(token.trim());
    try {
      const guild = await discord('/guilds/' + guildId);
      const [channels, roles] = await Promise.all([discord('/guilds/' + guildId + '/channels'), discord('/guilds/' + guildId + '/roles')]);
      return { guild: { id: guild.id, name: guild.name, icon: guild.icon }, channels, roles };
    } catch (error) {
      if (previous) fs.writeFileSync(credentialPath(), previous); else if (fs.existsSync(credentialPath())) fs.unlinkSync(credentialPath());
      throw error;
    }
  });
  ipcMain.handle('discord:structure', async (_event, guildId) => {
    const [guild, channels, roles] = await Promise.all([discord('/guilds/' + guildId), discord('/guilds/' + guildId + '/channels'), discord('/guilds/' + guildId + '/roles')]);
    return { guild: { id: guild.id, name: guild.name, icon: guild.icon }, channels, roles };
  });
  ipcMain.handle('discord:create-channel', async (_event, { guildId, name, type, parentId }) => {
    const payload = { name, type: type === 'voice' ? 2 : type === 'category' ? 4 : 0 };
    if (parentId) payload.parent_id = parentId;
    return discord('/guilds/' + guildId + '/channels', { method: 'POST', body: JSON.stringify(payload) });
  });
  ipcMain.handle('discord:delete-channel', async (_event, channelId) => discord('/channels/' + channelId, { method: 'DELETE' }));
  ipcMain.handle('discord:set-channel-permissions', async (_event, { channelId, roleId, allow, deny }) => {
    if (![channelId, roleId].every(value => typeof value === 'string' && /^\\d{17,20}$/.test(value))) throw new Error('Invalid channel or role ID.');
    if (![allow, deny].every(value => typeof value === 'string' && /^\\d+$/.test(value))) throw new Error('Invalid permission bitfield.');
    return discord('/channels/' + channelId + '/permissions/' + roleId, {
      method: 'PUT', body: JSON.stringify({ type: 0, allow, deny })
    });
  });
  ipcMain.handle('discord:create-role', async (_event, { guildId, name, color }) => discord('/guilds/' + guildId + '/roles', { method: 'POST', body: JSON.stringify({ name, color: color || 0xA879F5 }) }));
  ipcMain.handle('discord:delete-role', async (_event, { guildId, roleId }) => discord('/guilds/' + guildId + '/roles/' + roleId, { method: 'DELETE' }));
  ipcMain.handle('discord:disconnect', async () => { if (fs.existsSync(credentialPath())) fs.unlinkSync(credentialPath()); return true; });
}
function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1120, minHeight: 720,
    backgroundColor: '#0c0a11', title: 'WHIPPIN — Discord Server Manager',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  if (!app.isPackaged) win.loadURL('http://127.0.0.1:5173');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
app.whenReady().then(() => { registerDiscordHandlers(); createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });