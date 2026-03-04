const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('openclaw', {
    readFile: (relativePath) => ipcRenderer.invoke('openclaw:read-file', relativePath),
    readDir: (relativePath) => ipcRenderer.invoke('openclaw:read-dir', relativePath),
    fileExists: (relativePath) => ipcRenderer.invoke('openclaw:file-exists', relativePath),
});
