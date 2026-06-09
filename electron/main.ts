import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerIpcHandlers } from './ipc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let mainWin: BrowserWindow | null = null  // renamed to make it explicit

function createWindow() {
  mainWin = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    width: 440,
    height: 580,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    mainWin.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWin.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) app.quit()

app.on('window-all-closed', () => {
  // Only quit if the MAIN window is gone, not any secondary windows
  if (process.platform !== 'darwin') {
    if (!mainWin || mainWin.isDestroyed()) {
      app.quit()
      mainWin = null
    }
  }
})

app.on('activate', () => {
  if (!mainWin || mainWin.isDestroyed()) createWindow()
})

app.whenReady().then(() => {
  createWindow()
  registerIpcHandlers(() => mainWin)  // always returns the main window
})