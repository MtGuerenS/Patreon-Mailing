import { app, ipcMain, BrowserWindow, protocol, net } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
const PATREON_CLIENT_ID = process.env.PATREON_CLIENT_ID ?? "";
const PATREON_CLIENT_SECRET = process.env.PATREON_CLIENT_SECRET ?? "";
const REDIRECT_URI = "patreon-app://callback";
let authWindow = null;
let win;
app.setAsDefaultProtocolClient("patreon-app");
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function openPatreonAuth() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: PATREON_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "identity identity[email] campaigns memberships"
  });
  const authUrl = `https://www.patreon.com/oauth2/authorize?${params}`;
  authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    parent: win ?? void 0,
    modal: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  authWindow.loadURL(authUrl);
  authWindow.on("closed", () => {
    authWindow = null;
  });
}
async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    client_id: PATREON_CLIENT_ID,
    client_secret: PATREON_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  });
  const response = await net.fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${response.status}`);
  return response.json();
}
app.on("open-url", async (event, url) => {
  event.preventDefault();
  await handleCallback(url);
});
app.on("second-instance", async (_event, argv) => {
  const url = argv.find((arg) => arg.startsWith("patreon-app://"));
  if (url) await handleCallback(url);
  if (win) {
    win.show();
    win.focus();
  }
});
async function handleCallback(url) {
  const { searchParams } = new URL(url);
  const code = searchParams.get("code");
  authWindow == null ? void 0 : authWindow.close();
  if (!code) {
    win == null ? void 0 : win.webContents.send("patreon-auth-error", "No code received");
    return;
  }
  try {
    const tokens = await exchangeCodeForToken(code);
    win == null ? void 0 : win.webContents.send("patreon-auth-success", tokens);
  } catch (err) {
    win == null ? void 0 : win.webContents.send("patreon-auth-error", err.message);
  }
}
ipcMain.on("patreon-login", () => openPatreonAuth());
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.whenReady().then(() => {
  if (process.platform !== "darwin") {
    protocol.handle("patreon-app", (request) => {
      return new Response(null, { status: 200 });
    });
  }
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
