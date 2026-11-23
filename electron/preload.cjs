const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('whippin', {
  connect: (payload) => ipcRenderer.invoke('discord:connect', payload),
  getStructure: (guildId) => ipcRenderer.invoke('discord:structure', guildId),
  createChannel: (payload) => ipcRenderer.invoke('discord:create-channel', payload),
  deleteChannel: (channelId) => ipcRenderer.invoke('discord:delete-channel', channelId),
  updateChannel: (payload) => ipcRenderer.invoke('discord:update-channel', payload),
  reorderChannels: (payload) => ipcRenderer.invoke('discord:reorder-channels', payload),
  setRolePermissions: (payload) => ipcRenderer.invoke('discord:set-role-permissions', payload),
  syncCategoryPermissions: (categoryId) => ipcRenderer.invoke('discord:sync-category-permissions', categoryId),
  bulkDeleteChannels: (channelIds) => ipcRenderer.invoke('discord:bulk-delete-channels', channelIds),
  bulkUpdateChannels: (payload) => ipcRenderer.invoke('discord:bulk-update-channels', payload),
  setChannelPermissions: (payload) => ipcRenderer.invoke('discord:set-channel-permissions', payload),
  createRole: (payload) => ipcRenderer.invoke('discord:create-role', payload),
  deleteRole: (payload) => ipcRenderer.invoke('discord:delete-role', payload),
  disconnect: () => ipcRenderer.invoke('discord:disconnect'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  installUpdate: () => ipcRenderer.invoke('app:install-update'),
  onUpdateStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('app:update-status', listener);
    return () => ipcRenderer.removeListener('app:update-status', listener);
  }
});