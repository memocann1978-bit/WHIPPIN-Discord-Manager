const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('whippin', {
  connect: (payload) => ipcRenderer.invoke('discord:connect', payload),
  getStructure: (guildId) => ipcRenderer.invoke('discord:structure', guildId),
  getMembers: (payload) => ipcRenderer.invoke('discord:members', payload),
  updateMember: (payload) => ipcRenderer.invoke('discord:update-member', payload),
  kickMember: (payload) => ipcRenderer.invoke('discord:kick-member', payload),
  banMember: (payload) => ipcRenderer.invoke('discord:ban-member', payload),
  unbanMember: (payload) => ipcRenderer.invoke('discord:unban-member', payload),
  getBans: (guildId) => ipcRenderer.invoke('discord:get-bans', guildId),
  getMessages: (payload) => ipcRenderer.invoke('discord:get-messages', payload),
  deleteMessage: (payload) => ipcRenderer.invoke('discord:delete-message', payload),
  bulkDeleteMessages: (payload) => ipcRenderer.invoke('discord:bulk-delete-messages', payload),
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