/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string
    VITE_PUBLIC: string
  }
}

interface Window {
  patreonAPI: {
    login: () => void
    onAuthSuccess: (callback: (tokens: {
      access_token: string
      refresh_token: string
      expires_in: number
    }) => void) => void
    onAuthError: (callback: (message: string) => void) => void
  }
}