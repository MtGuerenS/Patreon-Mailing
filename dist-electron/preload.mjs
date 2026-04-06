"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("patreonAPI", {
  // Renderer → Main: trigger the auth window
  login: () => electron.ipcRenderer.send("patreon-login"),
  // Main → Renderer: listen for successful auth
  onAuthSuccess: (callback) => {
    electron.ipcRenderer.once("patreon-auth-success", (_event, tokens) => callback(tokens));
  },
  // Main → Renderer: listen for auth errors
  onAuthError: (callback) => {
    electron.ipcRenderer.once("patreon-auth-error", (_event, message) => callback(message));
  }
});
