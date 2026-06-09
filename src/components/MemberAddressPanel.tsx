import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { X, Pencil, TriangleAlert, Loader2, RotateCcw } from "lucide-react";
import { VisuallyHidden as VisuallyHiddenPrimitive } from "radix-ui";
import { FloatingInput } from "@/components/FloatingInput";
import { type MemberRow } from "@/lib/patreon";
import type { DbMember } from "@/shared/db-types"
import { getCountryName, toUpper, type CleanAddressForm, emptyForm } from '@/shared/address-utils'
import type { PatreonMember, PatreonIncluded, PatreonPledgeEvent } from "@/shared/patreon-types"
import { isPledgeEvent } from "@/shared/patreon-types"
import { format } from "date-fns"

interface ContentProps {
  member: MemberRow;
  rawMember: PatreonMember | null;
  included: PatreonIncluded[];
  dbMemberMap: Record<string, DbMember>;
  onClose?: () => void;
  onDbRefresh: (members: DbMember[]) => void;
}

function getPledgeEventColor(id: string): string {
  const type = id.split(':')[0]
  switch (type) {
    case 'subscription': return 'bg-green-500'
    case 'pledge_start': return 'bg-blue-500'
    case 'pledge_upgrade': return 'bg-purple-500'
    case 'pledge_downgrade': return 'bg-orange-500'
    case 'pledge_delete': return 'bg-destructive'
    default: return 'bg-muted-foreground'
  }
}

// Shared inner content — used by both the Sheet wrapper and inline in ExpandedEnvelope
export function MemberAddressPanelContent({
  member, rawMember, included, dbMemberMap, onClose, onDbRefresh,
}: ContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState<CleanAddressForm>(emptyForm);

  const pledgeEvents = useMemo<PatreonPledgeEvent[]>(() => {
    if (!rawMember) return []
    const ids = new Set(
      ((rawMember.relationships?.pledge_history?.data as Array<{ id: string }>) ?? [])
        .map((d) => d.id)
    )
    return included
      .filter((i): i is PatreonPledgeEvent => isPledgeEvent(i) && ids.has(i.id))
      .sort((a, b) => new Date(b.attributes.date).getTime() - new Date(a.attributes.date).getTime())
  }, [rawMember, included])

  useEffect(() => {
    if (rawMember) {
      console.log('rawMember:', JSON.stringify(rawMember, null, 2))
    }
  }, [rawMember])

  useEffect(() => {
    if (pledgeEvents.length > 0) {
      console.log('first pledge event:', JSON.stringify(pledgeEvents[0], null, 2))
    }
  }, [pledgeEvents])

  useEffect(() => {
    if (isEditing) {
      const db = dbMemberMap[member.id];
      setForm({
        clean_addressee: db?.clean_addressee || toUpper(member.addressee),
        clean_line_1: db?.clean_line_1 || toUpper(member.line_1),
        clean_line_2: db?.clean_line_2 || toUpper(member.line_2),
        clean_city: db?.clean_city || toUpper(member.city),
        clean_state: db?.clean_state || toUpper(member.state),
        clean_postal_code: db?.clean_postal_code || toUpper(member.zip),
        clean_country: db?.clean_country || getCountryName(member.country),
      });
    }
  }, [isEditing, member, dbMemberMap]);

  const setField =
    (field: keyof CleanAddressForm) =>
      (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value.toUpperCase() }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await window.patreonAPI.dbUpdateCleanAddress(member.id, {
        ...form,
        address_status: "verified",
      });
      const db = await window.patreonAPI.dbGetMembers();
      onDbRefresh(db);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save clean address:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const liveDb = dbMemberMap[member.id];
      const resetStatus = liveDb?.raw_line_1 ? "check_needed" : "missing";
      await window.patreonAPI.dbUpdateCleanAddress(member.id, {
        ...emptyForm,
        address_status: resetStatus,
      });
      const db = await window.patreonAPI.dbGetMembers();
      onDbRefresh(db);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to reset address:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const liveDb = dbMemberMap[member.id];

  return (
    <div className="flex flex-col h-full">
      {onClose && (
        <div className="flex items-center justify-end px-3 py-3 shrink-0">
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={onClose}>
            <X className="!h-5 !w-5 shrink-0" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4 px-6 pb-6">

        {/* Patreon Address Card */}
        <Card className="bg-background ring-0">
          <CardHeader>
            <CardTitle className="text-sm">Patreon Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground flex flex-col gap-1 select-text cursor-text">
            {liveDb?.raw_addressee && <p>{liveDb.raw_addressee}</p>}
            {liveDb?.raw_line_1 ? (
              <p>{liveDb.raw_line_1}</p>
            ) : (
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
                <p className="italic">No address on file</p>
              </div>
            )}
            {liveDb?.raw_line_2 && <p>{liveDb.raw_line_2}</p>}
            {liveDb?.raw_city && (
              <p>
                {liveDb.raw_city}
                {liveDb.raw_state ? `, ${liveDb.raw_state}` : ""}
                {liveDb.raw_postal_code ? ` ${liveDb.raw_postal_code}` : ""}
              </p>
            )}
            {liveDb?.raw_country && <p>{liveDb.raw_country}</p>}
          </CardContent>
        </Card>

        {/* Clean Address Card */}
        <Card className="bg-background ring-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Clean Address</CardTitle>
            {isEditing ? (
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-full p-0 text-destructive hover:text-destructive"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              </Button>
            ) : (
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Syncing members...</p>
              </div>
            ) : isEditing ? (
              <div className="flex flex-col gap-3">
                <FloatingInput label="Addressee" value={form.clean_addressee} onChange={setField("clean_addressee")} />
                <FloatingInput label="Address Line 1" value={form.clean_line_1} onChange={setField("clean_line_1")} />
                <FloatingInput label="Address Line 2" value={form.clean_line_2} onChange={setField("clean_line_2")} />
                <div className="flex gap-2">
                  <FloatingInput label="City" value={form.clean_city} onChange={setField("clean_city")} className="flex-1" />
                  <FloatingInput label="State" value={form.clean_state} onChange={setField("clean_state")} className="w-20" />
                  <FloatingInput label="ZIP" value={form.clean_postal_code} onChange={setField("clean_postal_code")} className="w-24" />
                </div>
                <FloatingInput label="Country" value={form.clean_country} onChange={setField("clean_country")} />
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" className="flex-1 h-11" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                  <Button className="flex-1 h-11" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </div>
            ) : liveDb?.clean_line_1 ? (
              <div className="flex flex-col gap-1">
                {liveDb.clean_addressee && <p>{liveDb.clean_addressee}</p>}
                <p>{liveDb.clean_line_1}</p>
                {liveDb.clean_line_2 && <p>{liveDb.clean_line_2}</p>}
                {liveDb.clean_city && (
                  <p>
                    {liveDb.clean_city}
                    {liveDb.clean_state ? `, ${liveDb.clean_state}` : ""}
                    {liveDb.clean_postal_code ? ` ${liveDb.clean_postal_code}` : ""}
                  </p>
                )}
                {liveDb.clean_country && <p>{liveDb.clean_country}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4 shrink-0 text-yellow-500" />
                <p className="italic">No verified address yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pledge History Card */}
        {pledgeEvents.length > 0 && (
          <Card className="bg-background ring-0">
            <CardHeader>
              <CardTitle className="text-sm">Pledge History</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground p-0">
              <div className="overflow-y-auto max-h-64 flex flex-col gap-0 px-6 pb-6 scrollbar-thin scrollbar-autohide">
                {pledgeEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-1 py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${getPledgeEventColor(event.id)}`} />
                        <span className="font-medium text-foreground">
                          {format(new Date(event.attributes.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <span className={event.attributes.payment_status === "Paid" ? "text-foreground font-medium" : "text-destructive"}>
                        {event.attributes.payment_status === "Paid"
                          ? `${event.attributes.currency_code} ${(event.attributes.amount_cents / 100).toFixed(2)}`
                          : event.attributes.payment_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pl-4">
                      <span className="text-xs capitalize text-muted-foreground">
                        {event.id.split(':')[0].replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.attributes.tier_title ?? "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Sheet wrapper — used in MembersPage
interface SheetProps {
  selectedMember: MemberRow | null;
  dbMemberMap: Record<string, DbMember>;
  onClose: () => void;
  onDbRefresh: (members: DbMember[]) => void;
  members: PatreonMember[];
  included: PatreonIncluded[];
}

export function MemberAddressPanel({
  selectedMember, dbMemberMap, onClose, onDbRefresh, members, included,
}: SheetProps) {
  const rawMember = selectedMember
    ? members.find((m) => m.id === selectedMember.id) ?? null
    : null;

  return (
    <Sheet open={!!selectedMember} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[450px] sm:max-w-[450px] p-0 bg-sidebar overflow-y-auto scrollbar-thin scrollbar-autohide" showCloseButton={false}>
        <VisuallyHiddenPrimitive.Root>
          <SheetTitle>{selectedMember?.full_name}</SheetTitle>
        </VisuallyHiddenPrimitive.Root>
        {selectedMember && (
          <MemberAddressPanelContent
            member={selectedMember}
            rawMember={rawMember}
            included={included}
            dbMemberMap={dbMemberMap}
            onClose={onClose}
            onDbRefresh={onDbRefresh}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}