const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onWakeWordDetected: (callback) => ipcRenderer.on('wake-word-detected', callback),
    onStartListening: (callback) => ipcRenderer.on('start-listening', callback),
    onStopListening: (callback) => ipcRenderer.on('stop-listening', callback),
    onActivateListening: (callback) => ipcRenderer.on('activate-listening', callback),
    onStartBackgroundListening: (callback) => ipcRenderer.on('start-background-listening', callback),
    onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback),
    sendWakeWordDetected: () => ipcRenderer.send('wake-word-detected'),
    sendCommandExecuted: (data) => ipcRenderer.send('command-executed', data)
});
