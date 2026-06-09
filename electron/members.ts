import { net } from 'electron'
import { store } from './store'
import type {
  PatreonMember,
  PatreonIncluded,
  PatreonMembersResponse,
  MembersCache,
} from '../src/shared/patreon-types'

const CACHE_TTL = 60 * 60 * 1000

export function saveMembersCache(campaignId: string, data: PatreonMember[], included: PatreonIncluded[]): void {
  const cache: MembersCache = { campaignId, data, included, cachedAt: Date.now() }
  store.set('members_cache', JSON.stringify(cache))
}

export function loadMembersCache(): MembersCache | null {
  try {
    const raw = store.get<string>('members_cache')
    if (!raw) return null
    const cache = JSON.parse(raw) as MembersCache
    if (Date.now() - cache.cachedAt > CACHE_TTL) {
      store.delete('members_cache')
      return null
    }
    return cache
  } catch {
    return null
  }
}

export function clearMembersCache(): void {
  store.delete('members_cache')
}

export async function fetchCampaigns(accessToken: string) {
  const params = new URLSearchParams({
    'fields[campaign]': 'patron_count,creation_name',
  })
  const response = await net.fetch(
    `https://www.patreon.com/api/oauth2/v2/campaigns?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!response.ok) throw new Error(`Failed to fetch campaigns: ${response.status}`)
  return response.json()
}

export async function fetchCampaignMembers(
  campaignId: string,
  accessToken: string
): Promise<{ data: PatreonMember[]; included: PatreonIncluded[]; cachedAt: number }> {
  const cache = loadMembersCache()
  if (cache && cache.campaignId === campaignId) {
    return { data: cache.data, included: cache.included, cachedAt: cache.cachedAt }
  }

  const params = new URLSearchParams({
    include: 'currently_entitled_tiers,address,user,pledge_history',
    'fields[member]': 'full_name,is_follower,last_charge_date,last_charge_status,lifetime_support_cents,currently_entitled_amount_cents,patron_status',
    'fields[user]': 'full_name,email,thumb_url',
    'fields[address]': 'addressee,line_1,line_2,city,state,postal_code,country,phone_number',
    'fields[tier]': 'title,amount_cents',
    'fields[pledge-event]': 'date,payment_status,tier_title,amount_cents,currency_code',
    'page[count]': '500',
  })

  let allMembers: PatreonMember[] = []
  let allIncluded: PatreonIncluded[] = []
  let url: string | null = `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?${params}`

  while (url) {
    const response = await net.fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) throw new Error(`Failed to fetch members: ${response.status}`)

    const json = await response.json() as PatreonMembersResponse
    allMembers = allMembers.concat(json.data ?? [])
    allIncluded = allIncluded.concat(json.included ?? [])

    url = json.meta?.pagination?.cursors?.next
      ? `https://www.patreon.com/api/oauth2/v2/campaigns/${campaignId}/members?${params}&page[cursor]=${json.meta.pagination.cursors.next}`
      : null
  }

  const cachedAt = Date.now()
  saveMembersCache(campaignId, allMembers, allIncluded)
  return { data: allMembers, included: allIncluded, cachedAt }
}