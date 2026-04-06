import { app, BrowserWindow, ipcMain, shell, protocol, net } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// ─── Patreon OAuth Config ───────────────────────────────────────────────────
const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID ?? ''
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET ?? ''
const REDIRECT_URI = 'patreon-app://callback'

let authWindow: BrowserWindow | null = null
let win: BrowserWindow | null

// ─── Custom Protocol ─────────────────────────────────────────────────────────
// Must be called before app is ready
app.setAsDefaultProtocolClient('patreon-app')

// ─── Main Window ─────────────────────────────────────────────────────────────
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// ─── Patreon Auth ─────────────────────────────────────────────────────────────
function openPatreonAuth() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PATREON_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'identity identity[email] campaigns memberships',
  })

  const authUrl = `https://www.patreon.com/oauth2/authorize?${params}`

  authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: win ?? undefined,
    modal: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  authWindow.loadURL(authUrl)
  authWindow.on('closed', () => { authWindow = null })
}

async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: PATREON_CLIENT_ID,
    client_secret: PATREON_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
  })

  const response = await net.fetch('https://www.patreon.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`)
  return response.json()
}

// ─── Handle the custom protocol callback ─────────────────────────────────────
// macOS: deep link fires via 'open-url'
app.on('open-url', async (event, url) => {
  event.preventDefault()
  await handleCallback(url)
})

// Windows/Linux: deep link comes in as a second-instance argv
app.on('second-instance', async (_event, argv) => {
  const url = argv.find(arg => arg.startsWith('patreon-app://'))
  if (url) await handleCallback(url)
  if (win) { win.show(); win.focus() }
})

async function handleCallback(url: string) {
  const { searchParams } = new URL(url)
  const code = searchParams.get('code')

  authWindow?.close()

  if (!code) {
    win?.webContents.send('patreon-auth-error', 'No code received')
    return
  }

  try {
    const tokens = await exchangeCodeForToken(code)
    // TODO: persist tokens securely with safeStorage
    win?.webContents.send('patreon-auth-success', tokens)
  } catch (err) {
    win?.webContents.send('patreon-auth-error', (err as Error).message)
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.on('patreon-login', () => openPatreonAuth())

// ─── App Lifecycle ────────────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.whenReady().then(() => {
  // Register protocol for Windows/Linux (must be done after ready)
  if (process.platform !== 'darwin') {
    protocol.handle('patreon-app', (request) => {
      // Actual handling is done in second-instance / open-url
      return new Response(null, { status: 200 })
    })
  }
  createWindow()
})