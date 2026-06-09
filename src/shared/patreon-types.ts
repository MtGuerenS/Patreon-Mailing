// electron/patreon-types.ts

export interface PatreonAddress {
  addressee: string | null;
  line_1: string | null;
  line_2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone_number: string | null;
}

export interface PatreonMemberAttributes {
  full_name: string | null;
  is_follower: boolean;
  last_charge_date: string | null;
  last_charge_status: string | null;
  lifetime_support_cents: number;
  currently_entitled_amount_cents: number;
  patron_status: "active_patron" | "declined_patron" | "former_patron" | null;
}

export interface PatreonPledgeEventAttributes {
  date: string;
  payment_status:
    | "Paid"
    | "Declined"
    | "Deleted"
    | "Pending"
    | "Refunded"
    | "Fraud"
    | "Refunded by Patreon"
    | "Other"
    | "Partially Refunded"
    | "Free Trial"
    | "Refund Pending"
    | "Refund Declined";
  tier_title: string | null;
  amount_cents: number;
  currency_code: string;
}

export interface PatreonResource<T> {
  id: string;
  type: string;
  attributes: T;
  relationships?: Record<
    string,
    { data: { id: string; type: string } | Array<{ id: string; type: string }> }
  >;
}

export type PatreonMember = PatreonResource<PatreonMemberAttributes>;
export type PatreonAddressResource = PatreonResource<PatreonAddress>;
export type PatreonPledgeEvent = PatreonResource<PatreonPledgeEventAttributes>;

export type PatreonIncluded =
  | PatreonMember
  | PatreonAddressResource
  | PatreonPledgeEvent
  | PatreonResource<unknown>;

export interface PatreonMembersResponse {
  data: PatreonMember[];
  included: PatreonIncluded[];
  meta?: {
    pagination?: {
      cursors?: { next?: string };
      total?: number;
    };
  };
}

export interface MembersCache {
  campaignId: string;
  data: PatreonMember[];
  included: PatreonIncluded[];
  cachedAt: number;
}

export function isPledgeEvent(item: PatreonIncluded): item is PatreonPledgeEvent {
  return item.type === 'pledge-event'
}

export function isAddress(item: PatreonIncluded): item is PatreonAddressResource {
  return item.type === 'address'
}
