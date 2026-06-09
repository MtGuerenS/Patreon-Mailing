import { type DateRange } from "react-day-picker";
import type { PatreonMember, PatreonIncluded, PatreonAddressResource, PatreonPledgeEvent } from "@/shared/patreon-types";
import { isPledgeEvent, isAddress } from "@/shared/patreon-types";
import type { DbMember } from "@/shared/db-types";

export const MONTHS = [
  { value: "0", label: "January" },
  { value: "1", label: "February" },
  { value: "2", label: "March" },
  { value: "3", label: "April" },
  { value: "4", label: "May" },
  { value: "5", label: "June" },
  { value: "6", label: "July" },
  { value: "7", label: "August" },
  { value: "8", label: "September" },
  { value: "9", label: "October" },
  { value: "10", label: "November" },
  { value: "11", label: "December" },
];

export const currentYear = new Date().getFullYear();
export const YEARS = Array.from({ length: 4 }, (_, i) =>
  String(currentYear - i),
);

export type MemberRow = {
  id: string;
  packed: boolean;
  full_name: string;
  addressee: string;
  tier_title: string;
  line_1: string;
  line_2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  address_status: "verified" | "check_needed" | "missing" | null;
};

export function filterMembersByRange(
  members: PatreonMember[],
  included: PatreonIncluded[],
  range: DateRange | undefined,
): (PatreonMember & { _tierTitle: string })[] {
  if (!range?.from) return members.map(m => ({ ...m, _tierTitle: '—' }));

  const start = range.from;
  const end = range.to ?? range.from;
  const result: (PatreonMember & { _tierTitle: string })[] = [];

  for (const member of members) {
    const pledgeEventIds: string[] = (
      (member.relationships?.pledge_history?.data as Array<{ id: string }>) ?? []
    ).map((d) => d.id);

    if (pledgeEventIds.length === 0) continue;

    const pledgeEvents = included.filter(
      (item): item is PatreonPledgeEvent =>
        isPledgeEvent(item) && pledgeEventIds.includes(item.id),
    );

    const paidEventsInRange = pledgeEvents.filter((event) => {
      const eventDate = new Date(event.attributes.date);
      return (
        event.attributes.payment_status === "Paid" &&
        eventDate >= start &&
        eventDate <= end
      );
    });

    if (paidEventsInRange.length === 0) continue;

    paidEventsInRange.sort(
      (a, b) =>
        new Date(b.attributes.date).getTime() -
        new Date(a.attributes.date).getTime(),
    );

    result.push({
      ...member,
      _tierTitle: paidEventsInRange[0].attributes.tier_title ?? "—",
    });
  }

  return result;
}

export function buildTableRow(
  member: PatreonMember & { _tierTitle?: string },
  included: PatreonIncluded[],
  dbMember?: DbMember,
  packed = false,
): MemberRow {
  const addressId = (member.relationships?.address?.data as { id: string } | null)?.id;
  const address = addressId
    ? included.find((i): i is PatreonAddressResource => isAddress(i) && i.id === addressId)
    : null;

  const useClean = dbMember?.address_status === "verified" && dbMember?.clean_line_1;

  return {
    id: member.id,
    packed,
    full_name: member.attributes.full_name ?? "—",
    addressee: useClean ? (dbMember!.clean_addressee ?? "—") : (address?.attributes?.addressee ?? "—"),
    tier_title: member._tierTitle ?? "—",
    line_1: useClean ? (dbMember!.clean_line_1 ?? "—") : (address?.attributes?.line_1 ?? "—"),
    line_2: useClean ? (dbMember!.clean_line_2 ?? "—") : (address?.attributes?.line_2 ?? "—"),
    city: useClean ? (dbMember!.clean_city ?? "—") : (address?.attributes?.city ?? "—"),
    state: useClean ? (dbMember!.clean_state ?? "—") : (address?.attributes?.state ?? "—"),
    zip: useClean ? (dbMember!.clean_postal_code ?? "—") : (address?.attributes?.postal_code ?? "—"),
    country: useClean ? (dbMember!.clean_country ?? "—") : (address?.attributes?.country ?? "—"),
    address_status: dbMember?.address_status ?? null,
  };
}
