import { useMemo, useState } from "react";
import { type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MembersTable } from "@/components/MembersTable";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  filterMembersByRange,
  buildTableRow,
  MONTHS,
  currentYear,
  type MemberRow,
} from "@/lib/patreon";

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
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState(
    String(new Date().getMonth()),
  );
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  const dateRange = useMemo<DateRange>(
    () => ({
      from: new Date(parseInt(selectedYear), parseInt(selectedMonth), 1),
      to: new Date(
        parseInt(selectedYear),
        parseInt(selectedMonth) + 1,
        0,
        23,
        59,
        59,
        999,
      ),
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

  const tableData = useMemo(
    () => filteredMembers.map((m) => buildTableRow(m, included, dbMemberMap[m.id])),
    [filteredMembers, included, dbMemberMap],
  );

  const currentMonthLabel = MONTHS[parseInt(selectedMonth)].label;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Members</h1>
        <div className="flex items-center gap-3">
          {accessToken && !loading && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {!accessToken ? (
            <Button onClick={onLogin}>Login with Patreon</Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Log out
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      )}

      {accessToken && !loading && members.length > 0 && (
        <MembersTable
          data={tableData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          emptyLabel={`No members found for ${currentMonthLabel} ${selectedYear}.`}
          onMemberSelect={setSelectedMember}
        />
      )}

      <Sheet
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      >
        <SheetContent className="w-[400px] sm:max-w-[400px] p-0">
          <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">

            {/* Patreon Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Patreon Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
                {selectedMember?.addressee && selectedMember.addressee !== "—" && (
                  <p>{selectedMember.addressee}</p>
                )}
                {selectedMember?.street && selectedMember.street !== "—" ? (
                  <p>{selectedMember.street}</p>
                ) : (
                  <p className="italic">No address on file</p>
                )}
                {selectedMember?.city && selectedMember.city !== "—" && (
                  <p>
                    {selectedMember.city}
                    {selectedMember.state !== "—" ? `, ${selectedMember.state}` : ""}
                    {selectedMember.zip !== "—" ? ` ${selectedMember.zip}` : ""}
                  </p>
                )}
                {selectedMember?.country && selectedMember.country !== "—" && (
                  <p>{selectedMember.country}</p>
                )}
              </CardContent>
            </Card>

            {/* Clean Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clean Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="italic">No verified address yet</p>
              </CardContent>
            </Card>

          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}