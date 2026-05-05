const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    close: () => ipcRenderer.invoke('window:close'),
    toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
    isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
    setOpacity: (v) => ipcRenderer.invoke('window:setOpacity', v),
  },
  oauth: {
    start: (params) => ipcRenderer.invoke('oauth:start', params),
    cancel: () => ipcRenderer.invoke('oauth:cancel'),
  },
});
