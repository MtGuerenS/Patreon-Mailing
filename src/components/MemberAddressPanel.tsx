import { useState, useEffect } from "react";
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

const ISO_COUNTRIES: Record<string, string> = {
  AF: "Afghanistan", AX: "Aland Islands", AL: "Albania", DZ: "Algeria",
  AS: "American Samoa", AD: "Andorra", AO: "Angola", AI: "Anguilla",
  AQ: "Antarctica", AG: "Antigua And Barbuda", AR: "Argentina", AM: "Armenia",
  AW: "Aruba", AU: "Australia", AT: "Austria", AZ: "Azerbaijan",
  BS: "Bahamas", BH: "Bahrain", BD: "Bangladesh", BB: "Barbados",
  BY: "Belarus", BE: "Belgium", BZ: "Belize", BJ: "Benin", BM: "Bermuda",
  BT: "Bhutan", BO: "Bolivia", BA: "Bosnia And Herzegovina", BW: "Botswana",
  BV: "Bouvet Island", BR: "Brazil", IO: "British Indian Ocean Territory",
  BN: "Brunei Darussalam", BG: "Bulgaria", BF: "Burkina Faso", BI: "Burundi",
  KH: "Cambodia", CM: "Cameroon", CA: "Canada", CV: "Cape Verde",
  KY: "Cayman Islands", CF: "Central African Republic", TD: "Chad",
  CL: "Chile", CN: "China", CX: "Christmas Island", CC: "Cocos (Keeling) Islands",
  CO: "Colombia", KM: "Comoros", CG: "Congo", CD: "Congo, Democratic Republic",
  CK: "Cook Islands", CR: "Costa Rica", CI: "Cote D'Ivoire", HR: "Croatia",
  CU: "Cuba", CY: "Cyprus", CZ: "Czech Republic", DK: "Denmark",
  DJ: "Djibouti", DM: "Dominica", DO: "Dominican Republic", EC: "Ecuador",
  EG: "Egypt", SV: "El Salvador", GQ: "Equatorial Guinea", ER: "Eritrea",
  EE: "Estonia", ET: "Ethiopia", FK: "Falkland Islands (Malvinas)",
  FO: "Faroe Islands", FJ: "Fiji", FI: "Finland", FR: "France",
  GF: "French Guiana", PF: "French Polynesia", TF: "French Southern Territories",
  GA: "Gabon", GM: "Gambia", GE: "Georgia", DE: "Germany", GH: "Ghana",
  GI: "Gibraltar", GR: "Greece", GL: "Greenland", GD: "Grenada",
  GP: "Guadeloupe", GU: "Guam", GT: "Guatemala", GG: "Guernsey",
  GN: "Guinea", GW: "Guinea-Bissau", GY: "Guyana", HT: "Haiti",
  HM: "Heard Island & Mcdonald Islands", VA: "Holy See (Vatican City State)",
  HN: "Honduras", HK: "Hong Kong", HU: "Hungary", IS: "Iceland",
  IN: "India", ID: "Indonesia", IR: "Iran, Islamic Republic Of", IQ: "Iraq",
  IE: "Ireland", IM: "Isle Of Man", IL: "Israel", IT: "Italy",
  JM: "Jamaica", JP: "Japan", JE: "Jersey", JO: "Jordan", KZ: "Kazakhstan",
  KE: "Kenya", KI: "Kiribati", KR: "Korea", KW: "Kuwait", KG: "Kyrgyzstan",
  LA: "Lao People's Democratic Republic", LV: "Latvia", LB: "Lebanon",
  LS: "Lesotho", LR: "Liberia", LY: "Libyan Arab Jamahiriya",
  LI: "Liechtenstein", LT: "Lithuania", LU: "Luxembourg", MO: "Macao",
  MK: "Macedonia", MG: "Madagascar", MW: "Malawi", MY: "Malaysia",
  MV: "Maldives", ML: "Mali", MT: "Malta", MH: "Marshall Islands",
  MQ: "Martinique", MR: "Mauritania", MU: "Mauritius", YT: "Mayotte",
  MX: "Mexico", FM: "Micronesia, Federated States Of", MD: "Moldova",
  MC: "Monaco", MN: "Mongolia", ME: "Montenegro", MS: "Montserrat",
  MA: "Morocco", MZ: "Mozambique", MM: "Myanmar", NA: "Namibia",
  NR: "Nauru", NP: "Nepal", NL: "Netherlands", AN: "Netherlands Antilles",
  NC: "New Caledonia", NZ: "New Zealand", NI: "Nicaragua", NE: "Niger",
  NG: "Nigeria", NU: "Niue", NF: "Norfolk Island", MP: "Northern Mariana Islands",
  NO: "Norway", OM: "Oman", PK: "Pakistan", PW: "Palau",
  PS: "Palestinian Territory, Occupied", PA: "Panama", PG: "Papua New Guinea",
  PY: "Paraguay", PE: "Peru", PH: "Philippines", PN: "Pitcairn",
  PL: "Poland", PT: "Portugal", PR: "Puerto Rico", QA: "Qatar",
  RE: "Reunion", RO: "Romania", RU: "Russian Federation", RW: "Rwanda",
  BL: "Saint Barthelemy", SH: "Saint Helena", KN: "Saint Kitts And Nevis",
  LC: "Saint Lucia", MF: "Saint Martin", PM: "Saint Pierre And Miquelon",
  VC: "Saint Vincent And Grenadines", WS: "Samoa", SM: "San Marino",
  ST: "Sao Tome And Principe", SA: "Saudi Arabia", SN: "Senegal",
  RS: "Serbia", SC: "Seychelles", SL: "Sierra Leone", SG: "Singapore",
  SK: "Slovakia", SI: "Slovenia", SB: "Solomon Islands", SO: "Somalia",
  ZA: "South Africa", GS: "South Georgia And Sandwich Isl.", ES: "Spain",
  LK: "Sri Lanka", SD: "Sudan", SR: "Suriname", SJ: "Svalbard And Jan Mayen",
  SZ: "Swaziland", SE: "Sweden", CH: "Switzerland", SY: "Syrian Arab Republic",
  TW: "Taiwan", TJ: "Tajikistan", TZ: "Tanzania", TH: "Thailand",
  TL: "Timor-Leste", TG: "Togo", TK: "Tokelau", TO: "Tonga",
  TT: "Trinidad And Tobago", TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan",
  TC: "Turks And Caicos Islands", TV: "Tuvalu", UG: "Uganda", UA: "Ukraine",
  AE: "United Arab Emirates", GB: "United Kingdom", US: "United States",
  UM: "United States Outlying Islands", UY: "Uruguay", UZ: "Uzbekistan",
  VU: "Vanuatu", VE: "Venezuela", VN: "Viet Nam", VG: "Virgin Islands, British",
  VI: "Virgin Islands, U.S.", WF: "Wallis And Futuna", EH: "Western Sahara",
  YE: "Yemen", ZM: "Zambia", ZW: "Zimbabwe",
};

export function getCountryName(code: string): string {
  if (!code || code === "—") return "";
  return (ISO_COUNTRIES[code.toUpperCase()] ?? code).toUpperCase();
}

export function toUpper(val: string | undefined): string {
  if (!val || val === "—") return "";
  return val.toUpperCase();
}

export interface CleanAddressForm {
  clean_addressee: string;
  clean_line_1: string;
  clean_line_2: string;
  clean_city: string;
  clean_state: string;
  clean_postal_code: string;
  clean_country: string;
}

export const emptyForm: CleanAddressForm = {
  clean_addressee: "",
  clean_line_1: "",
  clean_line_2: "",
  clean_city: "",
  clean_state: "",
  clean_postal_code: "",
  clean_country: "",
};

interface ContentProps {
  member: MemberRow;
  dbMemberMap: Record<string, any>;
  onClose?: () => void;
  onDbRefresh: (members: any[]) => void;
}

// Shared inner content — used by both the Sheet wrapper and inline in ExpandedEnvelope
export function MemberAddressPanelContent({
  member,
  dbMemberMap,
  onClose,
  onDbRefresh,
}: ContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [form, setForm] = useState<CleanAddressForm>(emptyForm);

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
      {/* Close bar */}
      {onClose && (
        <div className="flex items-center justify-end px-3 py-3">
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={onClose}>
            <X className="!h-5 !w-5 shrink-0" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-4 px-6 pb-6 overflow-y-auto">

        {/* Patreon Address Card */}
        <Card className="bg-background ring-0">
          <CardHeader>
            <CardTitle className="text-sm">Patreon Address</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
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
      </div>
    </div>
  );
}

// Sheet wrapper — used in MembersPage
interface SheetProps {
  selectedMember: MemberRow | null;
  dbMemberMap: Record<string, any>;
  onClose: () => void;
  onDbRefresh: (members: any[]) => void;
}

export function MemberAddressPanel({
  selectedMember,
  dbMemberMap,
  onClose,
  onDbRefresh,
}: SheetProps) {
  return (
    <Sheet open={!!selectedMember} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[450px] sm:max-w-[450px] p-0 bg-sidebar" showCloseButton={false}>
        <VisuallyHiddenPrimitive.Root>
          <SheetTitle>{selectedMember?.full_name}</SheetTitle>
        </VisuallyHiddenPrimitive.Root>
        {selectedMember && (
          <MemberAddressPanelContent
            member={selectedMember}
            dbMemberMap={dbMemberMap}
            onClose={onClose}
            onDbRefresh={onDbRefresh}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}