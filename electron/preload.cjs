const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('whippin', {
  connect: (payload) => ipcRenderer.invoke('discord:connect', payload),
  getStructure: (guildId) => ipcRenderer.invoke('discord:structure', guildId),
  createChannel: (payload) => ipcRenderer.invoke('discord:create-channel', payload),
  deleteChannel: (channelId) => ipcRenderer.invoke('discord:delete-channel', channelId),
  createRole: (payload) => ipcRenderer.invoke('discord:create-role', payload),
  deleteRole: (payload) => ipcRenderer.invoke('discord:delete-role', payload),
  disconnect: () => ipcRenderer.invoke('discord:disconnect')
});