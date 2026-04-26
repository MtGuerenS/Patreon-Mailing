import { type DateRange } from "react-day-picker";

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
  members: any[],
  included: any[],
  range: DateRange | undefined,
): any[] {
  if (!range?.from) return members;

  const start = range.from;
  const end = range.to ?? range.from;
  const result: any[] = [];

  for (const member of members) {
    const pledgeEventIds: string[] = (
      member.relationships?.pledge_history?.data ?? []
    ).map((d: any) => d.id);

    if (pledgeEventIds.length === 0) continue;

    const pledgeEvents = included.filter(
      (item) =>
        item.type === "pledge-event" && pledgeEventIds.includes(item.id),
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

    const mostRecent = paidEventsInRange[0];

    result.push({
      ...member,
      _tierTitle: mostRecent.attributes.tier_title ?? "—",
    });
  }

  return result;
}

export function buildTableRow(
  member: any,
  included: any[],
  dbMember?: any,
  packed = false,
): MemberRow {
  const addressId = member.relationships?.address?.data?.id;
  const address = included.find(
    (i) => i.type === "address" && i.id === addressId,
  );

  // Prefer clean DB address if verified, fall back to Patreon address
  const useClean =
    dbMember?.address_status === "verified" && dbMember?.clean_line_1;

  return {
    id: member.id,
    packed,
    full_name: member.attributes.full_name ?? "—",
    addressee: useClean
      ? (dbMember.clean_addressee ?? "—")
      : (address?.attributes?.addressee ?? "—"),
    tier_title: member._tierTitle ?? "—",
    line_1: useClean
      ? (dbMember.clean_line_1 ?? "—")
      : (address?.attributes?.line_1 ?? "—"),
    line_2: useClean
      ? (dbMember.clean_line_2 ?? "—")
      : (address?.attributes?.line_2 ?? "—"),
    city: useClean
      ? (dbMember.clean_city ?? "—")
      : (address?.attributes?.city ?? "—"),
    state: useClean
      ? (dbMember.clean_state ?? "—")
      : (address?.attributes?.state ?? "—"),
    zip: useClean
      ? (dbMember.clean_postal_code ?? "—")
      : (address?.attributes?.postal_code ?? "—"),
    country: useClean
      ? (dbMember.clean_country ?? "—")
      : (address?.attributes?.country ?? "—"),
    address_status: dbMember?.address_status ?? null,
  };
}
