const { app, BrowserWindow, ipcMain, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
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
  ipcMain.handle('discord:members', async (_event, { guildId, after }) => {
    if (typeof guildId !== 'string' || !/^\d{17,20}$/.test(guildId)) throw new Error('Geçersiz sunucu kimliği.');
    const query = new URLSearchParams({ limit: '1000' });
    if (after) query.set('after', after);
    return discord('/guilds/' + guildId + '/members?' + query.toString());
  });
  ipcMain.handle('discord:update-member', async (_event, { guildId, userId, nickname, roles, timeoutUntil }) => {
    if (![guildId,userId].every(value => typeof value === 'string' && /^\d{17,20}$/.test(value))) throw new Error('Geçersiz üye kimliği.');
    const payload = {};
    if (nickname !== undefined) payload.nick = nickname === null ? null : String(nickname).slice(0,32);
    if (roles !== undefined) { if (!Array.isArray(roles) || !roles.every(id => typeof id === 'string' && /^\d{17,20}$/.test(id))) throw new Error('Geçersiz rol listesi.'); payload.roles = roles; }
    if (timeoutUntil !== undefined) payload.communication_disabled_until = timeoutUntil;
    return discord('/guilds/' + guildId + '/members/' + userId, { method: 'PATCH', body: JSON.stringify(payload) });
  });
  ipcMain.handle('discord:kick-member', async (_event, { guildId, userId }) => discord('/guilds/' + guildId + '/members/' + userId, { method: 'DELETE' }));
  ipcMain.handle('discord:ban-member', async (_event, { guildId, userId, reason }) => discord('/guilds/' + guildId + '/bans/' + userId, { method: 'PUT', body: JSON.stringify({ delete_message_seconds: 0 }), headers: { 'X-Audit-Log-Reason': encodeURIComponent(String(reason || 'WHIPPIN üzerinden yasaklandı').slice(0, 500)) } }));
  ipcMain.handle('discord:unban-member', async (_event, { guildId, userId }) => discord('/guilds/' + guildId + '/bans/' + userId, { method: 'DELETE' }));
  ipcMain.handle('discord:get-bans', async (_event, guildId) => discord('/guilds/' + guildId + '/bans?limit=1000'));
  ipcMain.handle('discord:get-invites', async (_event, guildId) => discord('/guilds/' + guildId + '/invites'));
  ipcMain.handle('discord:create-invite', async (_event, { channelId, maxAge, maxUses, temporary }) => {
    if (typeof channelId !== 'string' || !/^\d{17,20}$/.test(channelId)) throw new Error('Geçersiz davet kanalı.');
    const age = Number(maxAge), uses = Number(maxUses);
    if (!Number.isInteger(age) || age < 0 || age > 604800 || !Number.isInteger(uses) || uses < 0 || uses > 100) throw new Error('Davet süresi veya kullanım sayısı geçersiz.');
    return discord('/channels/' + channelId + '/invites', { method: 'POST', body: JSON.stringify({ max_age: age, max_uses: uses, temporary: Boolean(temporary), unique: true }) });
  });
  ipcMain.handle('discord:delete-invite', async (_event, code) => {
    if (typeof code !== 'string' || !/^[a-zA-Z0-9-]{2,32}$/.test(code)) throw new Error('Geçersiz davet kodu.');
    return discord('/invites/' + code, { method: 'DELETE' });
  });
  ipcMain.handle('discord:audit-logs', async (_event, guildId) => { const result = await discord('/guilds/' + guildId + '/audit-logs?limit=100'); return result.audit_log_entries || []; });

  ipcMain.handle('discord:get-messages', async (_event, { channelId, before }) => {
    if (typeof channelId !== 'string' || !/^\d{17,20}$/.test(channelId)) throw new Error('Geçersiz kanal kimliği.');
    const query = new URLSearchParams({ limit: '100' }); if (before) query.set('before', before);
    return discord('/channels/' + channelId + '/messages?' + query.toString());
  });
  ipcMain.handle('discord:delete-message', async (_event, { channelId, messageId }) => discord('/channels/' + channelId + '/messages/' + messageId, { method: 'DELETE' }));
  ipcMain.handle('discord:bulk-delete-messages', async (_event, { channelId, messageIds }) => {
    if (typeof channelId !== 'string' || !/^\d{17,20}$/.test(channelId) || !Array.isArray(messageIds) || messageIds.length < 2 || messageIds.length > 100 || !messageIds.every(id => typeof id === 'string' && /^\d{17,20}$/.test(id))) throw new Error('Toplu silme için 2-100 geçerli mesaj seçin.');
    return discord('/channels/' + channelId + '/messages/bulk-delete', { method: 'POST', body: JSON.stringify({ messages: messageIds }) });
  });
  ipcMain.handle('discord:create-channel', async (_event, { guildId, name, type, parentId }) => {
    const payload = { name, type: type === 'voice' ? 2 : type === 'category' ? 4 : 0 };
    if (parentId) payload.parent_id = parentId;
    return discord('/guilds/' + guildId + '/channels', { method: 'POST', body: JSON.stringify(payload) });
  });
  ipcMain.handle('discord:update-channel', async (_event, { channelId, name, parentId }) => {
    if (typeof channelId !== 'string' || !/^\d{17,20}$/.test(channelId)) throw new Error('Geçersiz kanal kimliği.');
    const payload = {};
    if (typeof name === 'string') { if (!name.trim() || name.length > 100) throw new Error('Kanal adı 1-100 karakter olmalıdır.'); payload.name = name.trim(); }
    if (parentId !== undefined) payload.parent_id = parentId === null || parentId === 'none' ? null : parentId;
    return discord('/channels/' + channelId, { method: 'PATCH', body: JSON.stringify(payload) });
  });
  ipcMain.handle('discord:reorder-channels', async (_event, { guildId, positions }) => {
    if (typeof guildId !== 'string' || !/^\d{17,20}$/.test(guildId) || !Array.isArray(positions) || !positions.length || positions.length > 100) throw new Error('Geçersiz sıralama isteği.');
    for (const item of positions) if (!item || typeof item.id !== 'string' || !/^\d{17,20}$/.test(item.id) || !Number.isInteger(item.position) || item.position < 0) throw new Error('Geçersiz kanal konumu.');
    return discord('/guilds/' + guildId + '/channels', { method: 'PATCH', body: JSON.stringify(positions) });
  });
  ipcMain.handle('discord:sync-category-permissions', async (_event, categoryId) => {
    if (typeof categoryId !== 'string' || !/^\d{17,20}$/.test(categoryId)) throw new Error('Geçersiz kategori kimliği.');
    const category = await discord('/channels/' + categoryId);
    if (category.type !== 4) throw new Error('Seçilen öğe bir kategori değil.');
    const channels = await discord('/guilds/' + category.guild_id + '/channels');
    const children = channels.filter(channel => channel.parent_id === categoryId);
    const results = { synced: 0, failed: [] };
    for (const child of children) {
      try { await discord('/channels/' + child.id, { method: 'PATCH', body: JSON.stringify({ permission_overwrites: category.permission_overwrites || [] }) }); results.synced++; }
      catch (error) { results.failed.push({ id: child.id, message: error.message }); }
    }
    return results;
  });
  ipcMain.handle('discord:set-role-permissions', async (_event, { guildId, roleId, permissions }) => {
    if (![guildId, roleId].every(value => typeof value === 'string' && /^\d{17,20}$/.test(value)) || typeof permissions !== 'string' || !/^\d+$/.test(permissions)) throw new Error('Geçersiz rol veya izin bilgisi.');
    return discord('/guilds/' + guildId + '/roles/' + roleId, { method: 'PATCH', body: JSON.stringify({ permissions }) });
  });
  ipcMain.handle('discord:delete-channel', async (_event, channelId) => discord('/channels/' + channelId, { method: 'DELETE' }));
  ipcMain.handle('discord:bulk-delete-channels', async (_event, channelIds) => {
    if (!Array.isArray(channelIds) || channelIds.length < 1 || channelIds.length > 50 || !channelIds.every(id => typeof id === 'string' && /^\d{17,20}$/.test(id))) throw new Error('Select between 1 and 50 valid channels.');
    const results = { succeeded: [], failed: [] };
    for (const id of channelIds) { try { await discord('/channels/' + id, { method: 'DELETE' }); results.succeeded.push(id); } catch (error) { results.failed.push({ id, message: error.message }); } }
    return results;
  });
  ipcMain.handle('discord:bulk-update-channels', async (_event, { channelIds, parentId, prefix, suffix }) => {
    if (!Array.isArray(channelIds) || channelIds.length < 1 || channelIds.length > 50 || !channelIds.every(id => typeof id === 'string' && /^\d{17,20}$/.test(id))) throw new Error('Select between 1 and 50 valid channels.');
    if (parentId !== undefined && parentId !== null && parentId !== 'none' && (typeof parentId !== 'string' || !/^\d{17,20}$/.test(parentId))) throw new Error('Invalid category ID.');
    if (typeof prefix !== 'string' || typeof suffix !== 'string' || prefix.length > 30 || suffix.length > 30) throw new Error('Invalid rename prefix or suffix.');
    const results = { succeeded: [], failed: [] };
    for (const id of channelIds) { try { const channel = await discord('/channels/' + id); const payload = {}; if (parentId !== undefined) payload.parent_id = parentId === 'none' ? null : parentId; if (prefix || suffix) payload.name = (prefix + channel.name + suffix).slice(0, 100); await discord('/channels/' + id, { method: 'PATCH', body: JSON.stringify(payload) }); results.succeeded.push(id); } catch (error) { results.failed.push({ id, message: error.message }); } }
    return results;
  });
  ipcMain.handle('discord:set-channel-permissions', async (_event, { channelId, roleId, allow, deny }) => {
    if (![channelId, roleId].every(value => typeof value === 'string' && /^\d{17,20}$/.test(value))) throw new Error('Invalid channel or role ID.');
    if (![allow, deny].every(value => typeof value === 'string' && /^\d+$/.test(value))) throw new Error('Invalid permission bitfield.');
    return discord('/channels/' + channelId + '/permissions/' + roleId, {
      method: 'PUT', body: JSON.stringify({ type: 0, allow, deny })
    });
  });
  ipcMain.handle('discord:create-role', async (_event, { guildId, name, color }) => discord('/guilds/' + guildId + '/roles', { method: 'POST', body: JSON.stringify({ name, color: color || 0xA879F5 }) }));
  ipcMain.handle('discord:delete-role', async (_event, { guildId, roleId }) => discord('/guilds/' + guildId + '/roles/' + roleId, { method: 'DELETE' }));
  ipcMain.handle('discord:disconnect', async () => { if (fs.existsSync(credentialPath())) fs.unlinkSync(credentialPath()); return true; });
}
function registerUpdateHandlers() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  const send = (status, extra = {}) => BrowserWindow.getAllWindows().forEach(win => {
    if (!win.isDestroyed()) win.webContents.send('app:update-status', { status, ...extra });
  });
  autoUpdater.on('checking-for-update', () => send('checking'));
  autoUpdater.on('update-available', info => send('available', { version: info.version }));
  autoUpdater.on('update-not-available', info => send('not-available', { version: info.version }));
  autoUpdater.on('download-progress', progress => send('downloading', { percent: Math.round(progress.percent), transferred: progress.transferred, total: progress.total }));
  autoUpdater.on('update-downloaded', info => send('downloaded', { version: info.version }));
  autoUpdater.on('error', error => send('error', { message: error.message }));
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:check-updates', async () => {
    if (!app.isPackaged) return { status: 'development' };
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', version: result?.updateInfo?.version };
  });
  ipcMain.handle('app:install-update', () => {
    if (!app.isPackaged) throw new Error('Updates are available only in the installed application.');
    autoUpdater.quitAndInstall(false, true);
    return true;
  });
  if (app.isPackaged) {
    const checkAutomatically = () => autoUpdater.checkForUpdates().catch(error => send('error', { message: error.message }));
    setTimeout(checkAutomatically, 8000);
    const updateTimer = setInterval(checkAutomatically, 6 * 60 * 60 * 1000);
    if (typeof updateTimer.unref === 'function') updateTimer.unref();
  }
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
app.whenReady().then(() => { registerDiscordHandlers(); registerUpdateHandlers(); createWindow(); app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });