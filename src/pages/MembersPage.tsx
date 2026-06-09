import { useEffect, useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { MembersTable } from "@/components/MembersTable";
import { MemberAddressPanel } from "@/components/MemberAddressPanel";
import { filterMembersByRange, buildTableRow, MONTHS, type MemberRow } from "@/lib/patreon";
import { usePackedMembers } from "@/hooks/usePackedMembers";
import { useMembersContext } from "@/context/MembersContext";
import { Progress } from "@/components/ui/progress";

interface Props {
  accessToken: string | null
  loading: boolean
  loadStatus: string | null
  error: string | null
  onRefresh: () => void
  selectedMonth: string
  selectedYear: string
  onMonthChange: (val: string) => void
  onYearChange: (val: string) => void
}

export function MembersPage({
  accessToken, loading, loadStatus, error, onRefresh,
  selectedMonth, selectedYear, onMonthChange, onYearChange,
}: Props) {
  const { members, included, dbMembers, setDbMembers } = useMembersContext();
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);
  const [progress, setProgress] = useState(0)

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

  useEffect(() => {
    if (loadStatus === 'Fetching members...') {
      setProgress(10)
      const start = Date.now()
      const interval = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000
        const next = 10 + (elapsed / 15) * 85 // 10% → 95% over 15s
        if (next >= 95) {
          setProgress(95)
          clearInterval(interval)
        } else {
          setProgress(next)
        }
      }, 100)
      return () => clearInterval(interval)
    }
    if (!loadStatus) {
      setProgress(0)
    }
  }, [loadStatus])

  const currentMonthLabel = MONTHS[parseInt(selectedMonth)].label;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        {accessToken && !loading && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>Refresh</Button>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-24">
          <p className="text-sm text-muted-foreground">{loadStatus ?? 'Loading...'}</p>
          {loadStatus !== 'Fetching campaigns...' && (
            <Progress
              value={progress}
              className="w-48 [&>div]:transition-all [&>div]:duration-100"
            />
          )}
        </div>
      )}

      {accessToken && !loading && members.length > 0 && (
        <MembersTable
          data={tableData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          emptyLabel={`No members found for ${currentMonthLabel} ${selectedYear}.`}
          onMemberSelect={(m) => setSelectedMember(m)}
          onTogglePacked={togglePacked}
        />
      )}

      <MemberAddressPanel
        selectedMember={selectedMember}
        dbMemberMap={dbMemberMap}
        onClose={() => setSelectedMember(null)}
        onDbRefresh={setDbMembers}
        members={members}
        included={included}
      />
    </div>
  );
}