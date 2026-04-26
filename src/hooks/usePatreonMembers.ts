import { useState } from 'react'

export function usePatreonMembers() {
  const [members, setMembers] = useState<any[]>([])
  const [included, setIncluded] = useState<any[]>([])
  const [dbMembers, setDbMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMembers = async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      console.log('[loadMembers] Fetching campaigns...')
      const campaignData = await window.patreonAPI.getCampaigns(token)
      const campaignId = campaignData.data[0]?.id
      if (!campaignId) throw new Error('No campaign found for this account')
      console.log('[loadMembers] Fetching members for campaign:', campaignId)
      const memberData = await window.patreonAPI.getCampaignMembers(campaignId, token)
      setMembers(memberData.data ?? [])
      setIncluded(memberData.included ?? [])
      console.log(`[loadMembers] Fetched ${memberData.data?.length ?? 0} members, ${memberData.included?.length ?? 0} included`)
      console.log('[loadMembers] Syncing DB...')
      await window.patreonAPI.dbSyncMembers()
      console.log('[loadMembers] DB synced, loading DB members...')
      const db = await window.patreonAPI.dbGetMembers()
      setDbMembers(db ?? [])
      console.log(`[loadMembers] Done. ${db?.length ?? 0} members in DB`)
    } catch (err) {
      console.error('[loadMembers] Error:', err)
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const refreshMembers = async (token: string) => {
    await window.patreonAPI.refreshMembers()
    await loadMembers(token)
  }

  const reset = () => {
    setMembers([])
    setIncluded([])
    setDbMembers([])
    setError(null)
  }

  return { members, included, dbMembers, setDbMembers, loading, error, loadMembers, refreshMembers, reset }
}