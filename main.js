const { app, BrowserWindow, Menu, ipcMain, Tray, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;
let tray;
let isListening = false;
let wakeWordDetected = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png')
    });

    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Open DevTools in development
    // if (isDev) mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (event) => {
        if (app.quitting) {
            mainWindow = null;
        } else {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show JARVIS',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Start Listening',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('start-listening');
                    isListening = true;
                }
            }
        },
        {
            label: 'Stop Listening',
            click: () => {
                if (mainWindow) {
                    mainWindow.webContents.send('stop-listening');
                    isListening = false;
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('open-settings');
                }
            }
        },
        {
            label: 'Exit JARVIS',
            click: () => {
                app.quitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
}

app.on('ready', () => {
    createWindow();
    createTray();
    createMenu();
    startBackgroundListening();
});

app.on('window-all-closed', () => {
    // Keep app running in tray
    if (process.platform !== 'darwin') {
        // On non-Mac, don't quit - just minimize to tray
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC Handlers
ipcMain.on('wake-word-detected', () => {
    wakeWordDetected = true;
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('activate-listening');
    }
});

ipcMain.on('command-executed', (event, data) => {
    console.log('Command executed:', data);
});

// Background listening function
function startBackgroundListening() {
    console.log('Background listening started - listening for "Hey JARVIS"');
    // This will be handled by the renderer process
    if (mainWindow) {
        mainWindow.webContents.send('start-background-listening');
    }
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About JARVIS',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About JARVIS',
                            message: 'JARVIS - Advanced Voice Assistant',
                            detail: 'Your personal AI assistant\nVersion 1.0.0'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
