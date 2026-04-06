import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('patreonAPI', {
  // Renderer → Main: trigger the auth window
  login: () => ipcRenderer.send('patreon-login'),

  // Main → Renderer: listen for successful auth
  onAuthSuccess: (callback: (tokens: {
    access_token: string
    refresh_token: string
    expires_in: number
  }) => void) => {
    ipcRenderer.once('patreon-auth-success', (_event, tokens) => callback(tokens))
  },

  // Main → Renderer: listen for auth errors
  onAuthError: (callback: (message: string) => void) => {
    ipcRenderer.once('patreon-auth-error', (_event, message) => callback(message))
  },
})