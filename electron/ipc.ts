import { ipcMain } from "electron";
import {
  openPatreonAuth,
  loadTokens,
  clearTokens,
  isTokenExpired,
} from "./auth";
import {
  fetchCampaigns,
  fetchCampaignMembers,
  clearMembersCache,
  loadMembersCache,
} from "./members";
import {
  getAllMembers,
  getMemberById,
  upsertMember,
  updateCleanAddress,
  setAddressStatus,
  getDb,
  getPackedIds,
  setPacked,
} from "./db";
import type { BrowserWindow } from "electron";

export function registerIpcHandlers(getWin: () => BrowserWindow | null) {
  ipcMain.on("patreon-login", () => openPatreonAuth(getWin()));

  ipcMain.handle("patreon-get-saved-tokens", () => {
    if (isTokenExpired()) {
      clearTokens();
      return null;
    }
    return loadTokens();
  });

  ipcMain.handle("patreon-logout", () => {
    clearTokens();
    clearMembersCache();
  });

  ipcMain.handle(
    "patreon-get-campaigns",
    async (_event, accessToken: string) => {
      return fetchCampaigns(accessToken);
    },
  );

  ipcMain.handle(
    "patreon-get-campaign-members",
    async (_event, campaignId: string, accessToken: string) => {
      return fetchCampaignMembers(campaignId, accessToken);
    },
  );

  ipcMain.handle("patreon-refresh-members", () => {
    clearMembersCache();
  });

  ipcMain.handle("db-sync-members", (_event) => {
    const cache = loadMembersCache();
    if (!cache) throw new Error("No members cache found, fetch members first");

    const { data, included } = cache;

    // Filter to only members who have ever paid
    const paidMembers = data.filter((member) => {
      const pledgeEventIds: string[] = (
        member.relationships?.pledge_history?.data ?? []
      ).map((d: any) => d.id);

      if (pledgeEventIds.length === 0) return false;

      return included.some(
        (item) =>
          item.type === "pledge-event" &&
          pledgeEventIds.includes(item.id) &&
          item.attributes.payment_status === "Paid",
      );
    });

    const sync = getDb().transaction(() => {
      for (const member of paidMembers) {
        const existing = getMemberById(member.id);

        const addressId = member.relationships?.address?.data?.id ?? null;
        const addressObj = addressId
          ? included.find(
              (i: any) => i.type === "address" && i.id === addressId,
            )
          : null;
        const a = addressObj?.attributes ?? null;

        const hasAddress = !!a?.line_1;

        const addressChanged =
          existing &&
          hasAddress &&
          (existing.raw_line_1 !== (a.line_1 ?? null) ||
            existing.raw_city !== (a.city ?? null) ||
            existing.raw_postal_code !== (a.postal_code ?? null));

        const status: "missing" | "check_needed" | "verified" = !hasAddress
          ? "missing"
          : addressChanged
            ? "check_needed"
            : (existing?.address_status ?? "check_needed");

        upsertMember({
          id: member.id,
          full_name: member.attributes?.full_name ?? null,
          raw_addressee: a?.addressee ?? null,
          raw_line_1: a?.line_1 ?? null,
          raw_line_2: a?.line_2 ?? null,
          raw_city: a?.city ?? null,
          raw_state: a?.state ?? null,
          raw_postal_code: a?.postal_code ?? null,
          raw_country: a?.country ?? null,
          clean_addressee: existing?.clean_addressee ?? null,
          clean_line_1: existing?.clean_line_1 ?? null,
          clean_line_2: existing?.clean_line_2 ?? null,
          clean_city: existing?.clean_city ?? null,
          clean_state: existing?.clean_state ?? null,
          clean_postal_code: existing?.clean_postal_code ?? null,
          clean_country: existing?.clean_country ?? null,
          address_status: status,
        });
      }
    });

    sync();
    return getAllMembers();
  });

  ipcMain.handle("db-get-members", () => getAllMembers());

  ipcMain.handle("db-update-clean-address", (_event, id: string, fields) => {
    updateCleanAddress(id, fields);
  });

  ipcMain.handle("db-set-status", (_event, id: string, status) => {
    setAddressStatus(id, status);
  });

  ipcMain.handle("get-packed", (_e, year: number, month: number) =>
    getPackedIds(year, month),
  );

  ipcMain.handle(
    "set-packed",
    (_e, memberId: string, year: number, month: number, packed: boolean) => {
      setPacked(memberId, year, month, packed);
    },
  );
}
