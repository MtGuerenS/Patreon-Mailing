import { useState } from "react";
import type { PatreonMember, PatreonIncluded } from "@/shared/patreon-types";
import type { DbMember } from "@/shared/db-types";

export function usePatreonMembers() {
  const [members, setMembers] = useState<PatreonMember[]>([]);
  const [included, setIncluded] = useState<PatreonIncluded[]>([]);
  const [dbMembers, setDbMembers] = useState<DbMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      setLoadStatus("Fetching campaigns...");
      const campaignData = await window.patreonAPI.getCampaigns(token);
      const campaignId = campaignData.data[0]?.id;
      if (!campaignId) throw new Error("No campaign found for this account");
      setLoadStatus("Fetching members...");
      const memberData = await window.patreonAPI.getCampaignMembers(
        campaignId,
        token,
      );
      setMembers(memberData.data ?? []);
      setIncluded(memberData.included ?? []);
      setLoadStatus("Syncing database...");
      await window.patreonAPI.dbSyncMembers();
      setLoadStatus("Loading member data...");
      const db = await window.patreonAPI.dbGetMembers();
      setDbMembers(db ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadStatus(null);
      setLoading(false);
    }
  };

  const refreshMembers = async (token: string) => {
    await window.patreonAPI.refreshMembers();
    await loadMembers(token);
  };

  const reset = () => {
    setMembers([]);
    setIncluded([]);
    setDbMembers([]);
    setError(null);
  };

  return {
    members,
    included,
    dbMembers,
    setDbMembers,
    loading,
    loadStatus,
    error,
    loadMembers,
    refreshMembers,
    reset,
  };
}
