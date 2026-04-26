import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { MembersTable } from "@/components/MembersTable";
import { MemberAddressPanel } from "@/components/MemberAddressPanel";
import {
  filterMembersByRange,
  buildTableRow,
  MONTHS,
  type MemberRow,
} from "@/lib/patreon";
import { usePackedMembers } from "@/hooks/usePackedMembers";

interface Props {
  accessToken: string | null;
  members: any[];
  included: any[];
  dbMembers: any[];
  loading: boolean;
  error: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  onDbRefresh: (members: any[]) => void;
  selectedMonth: string;
  selectedYear: string;
  onMonthChange: (val: string) => void;
  onYearChange: (val: string) => void;
}

export function MembersPage({
  accessToken,
  members,
  included,
  dbMembers,
  loading,
  error,
  onLogin,
  onLogout,
  onRefresh,
  onDbRefresh,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
}: Props) {
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  const dateRange = useMemo<DateRange>(
    () => ({
      from: new Date(parseInt(selectedYear), parseInt(selectedMonth), 1),
      to: new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0, 23, 59, 59, 999),
    }),
    [selectedMonth, selectedYear],
  );

  const filteredMembers = useMemo(
    () => filterMembersByRange(members, included, dateRange),
    [members, included, dateRange],
  );

  const dbMemberMap = useMemo(
    () => Object.fromEntries(dbMembers.map((m) => [m.id, m])),
    [dbMembers],
  );

  const { packedIds, togglePacked } = usePackedMembers(selectedYear, selectedMonth);

  const tableData = useMemo(
    () => filteredMembers.map((m) => buildTableRow(m, included, dbMemberMap[m.id], packedIds.has(m.id))),
    [filteredMembers, included, dbMemberMap, packedIds],
  );

  const currentMonthLabel = MONTHS[parseInt(selectedMonth)].label;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <div className="flex items-center gap-3">
          {accessToken && !loading && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>Refresh</Button>
          )}
          {!accessToken ? (
            <Button onClick={onLogin}>Login with Patreon</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onLogout}>Log out</Button>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading members...</p>}

      {accessToken && !loading && members.length > 0 && (
        <MembersTable
          data={tableData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          emptyLabel={`No members found for ${currentMonthLabel} ${selectedYear}.`}
          onMemberSelect={(m) => { setSelectedMember(m); }}
          onTogglePacked={togglePacked}
        />
      )}

      <MemberAddressPanel
        selectedMember={selectedMember}
        dbMemberMap={dbMemberMap}
        onClose={() => setSelectedMember(null)}
        onDbRefresh={onDbRefresh}
      />
    </div>
  );
}