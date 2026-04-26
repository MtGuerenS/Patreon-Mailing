/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    VITE_PUBLIC: string;
  }
}

interface Window {
  patreonAPI: {
    login: () => void;
    getSavedTokens: () => Promise<{
      access_token: string;
      refresh_token: string;
    } | null>;
    logout: () => Promise<void>;
    onAuthSuccess: (
      callback: (tokens: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      }) => void,
    ) => void;
    onAuthError: (callback: (message: string) => void) => void;
    getCampaigns: (accessToken: string) => Promise<any>;
    getCampaignMembers: (
      campaignId: string,
      accessToken: string,
    ) => Promise<any>;
    refreshMembers: () => Promise<void>;
    dbSyncMembers: () => Promise<any[]>;
    dbGetMembers: () => Promise<any[]>;
    dbUpdateCleanAddress: (id: string, fields: any) => Promise<void>;
    dbSetStatus: (
      id: string,
      status: "verified" | "check_needed" | "missing",
    ) => Promise<void>;
    getPacked: (year: number, month: number) => Promise<string[]>;
    setPacked: (
      memberId: string,
      year: number,
      month: number,
      packed: boolean,
    ) => Promise<void>;
  };
}
