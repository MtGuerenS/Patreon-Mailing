import { ipcRenderer, contextBridge } from "electron";
import type { CleanAddressForm } from "../src/shared/address-utils";

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

  dbSyncMembers: () => ipcRenderer.invoke("db-sync-members"),

  dbGetMembers: () => ipcRenderer.invoke("db-get-members"),

  dbUpdateCleanAddress: (
    id: string,
    fields: CleanAddressForm & { address_status: "verified" | "check_needed" | "missing" },
  ) => ipcRenderer.invoke("db-update-clean-address", id, fields),

  dbSetStatus: (id: string, status: "verified" | "check_needed" | "missing") =>
    ipcRenderer.invoke("db-set-status", id, status),

  getPacked: (year: number, month: number) =>
    ipcRenderer.invoke("get-packed", year, month),

  setPacked: (memberId: string, year: number, month: number, packed: boolean) =>
    ipcRenderer.invoke("set-packed", memberId, year, month, packed),

  windowSetMain: () => ipcRenderer.send("window-set-main"),

  exportPdf: (dataUrls: string[], aspectRatio: number) =>
    ipcRenderer.invoke("export-pdf", dataUrls, aspectRatio),

  testPrintPdf: () => ipcRenderer.invoke("test-print-pdf"),

  ...(process.env.NODE_ENV === "development" && {
    devVerifyAll: () => ipcRenderer.invoke("dev-verify-all-members"),
    devUnverifyAll: () => ipcRenderer.invoke("dev-unverify-all-members"),
  }),
});