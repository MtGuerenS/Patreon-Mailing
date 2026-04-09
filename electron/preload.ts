import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("patreonAPI", {
  login: () => ipcRenderer.send("patreon-login"),

  getSavedTokens: () => ipcRenderer.invoke("patreon-get-saved-tokens"),

  logout: () => ipcRenderer.invoke("patreon-logout"),

  onAuthSuccess: (
    callback: (tokens: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }) => void,
  ) => {
    ipcRenderer.once("patreon-auth-success", (_event, tokens) =>
      callback(tokens),
    );
  },

  onAuthError: (callback: (message: string) => void) => {
    ipcRenderer.once("patreon-auth-error", (_event, message) =>
      callback(message),
    );
  },

  getCampaigns: (accessToken: string) =>
    ipcRenderer.invoke("patreon-get-campaigns", accessToken),

  getCampaignMembers: (campaignId: string, accessToken: string) =>
    ipcRenderer.invoke("patreon-get-campaign-members", campaignId, accessToken),

  refreshMembers: () => ipcRenderer.invoke("patreon-refresh-members"),

  dbSyncMembers: () => ipcRenderer.invoke('db-sync-members'),

  dbGetMembers: () => ipcRenderer.invoke("db-get-members"),

  dbUpdateCleanAddress: (id: string, fields: any) =>
    ipcRenderer.invoke("db-update-clean-address", id, fields),

  dbSetStatus: (id: string, status: string) =>
    ipcRenderer.invoke("db-set-status", id, status),
});
