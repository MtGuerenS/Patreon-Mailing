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
    getCampaigns: (accessToken: string) => Promise<{
      data: Array<{ id: string; attributes: { patron_count: number; creation_name: string } }>
    }>;
    getCampaignMembers: (
      campaignId: string,
      accessToken: string,
    ) => Promise<{
      data: import('./src/shared/patreon-types').PatreonMember[];
      included: import('./src/shared/patreon-types').PatreonIncluded[];
      cachedAt: number;
    }>;
    refreshMembers: () => Promise<void>;
    dbSyncMembers: () => Promise<import('./src/shared/db-types').DbMember[]>;
    dbGetMembers: () => Promise<import('./src/shared/db-types').DbMember[]>;
    dbUpdateCleanAddress: (
      id: string,
      fields: import('./src/shared/address-utils').CleanAddressForm & {
        address_status: "verified" | "check_needed" | "missing";
      },
    ) => Promise<void>;
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
    windowSetMain: () => void;
    exportPdf: (
      dataUrls: string[],
      aspectRatio: number
    ) => Promise<{ cancelled: boolean } | undefined>;
  };
}