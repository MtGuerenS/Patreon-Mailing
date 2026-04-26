import { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { type MemberRow } from "@/lib/patreon";
import { MemberAddressPanelContent } from "@/components/MemberAddressPanel";
import { jsPDF } from "jspdf";

type BoundingBox = { x: number; y: number; width: number; height: number };

interface PreviewState {
    templateSrc: string;
    widthPct: number;
    heightPct: number;
    bgColor: string;
    members: MemberRow[];
}

interface Props {
    dbMembers: any[];
    onDbRefresh: (members: any[]) => void;
}

function getBox(img: HTMLImageElement, wPct: number, hPct: number): BoundingBox {
    const w = img.naturalWidth * (wPct / 100);
    const h = img.naturalHeight * (hPct / 100);
    return {
        x: (img.naturalWidth - w) / 2,
        y: (img.naturalHeight - h) / 2,
        width: w,
        height: h,
    };
}

function drawEnvelope(
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    addressLines: string[],
    widthPct: number,
    heightPct: number,
    bgColor: string,
) {
    const ctx = canvas.getContext("2d")!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const box = getBox(img, widthPct, heightPct);
    const fontSize = box.height / 7;

    return document.fonts.load(`${fontSize}px "Delius"`).then(() => {
        if (bgColor !== "rgba(0,0,0,0)") {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        ctx.save();
        let fs = fontSize;
        ctx.font = `${fs}px "Delius"`;
        const paddedWidth = box.width * 0.9;
        const longestLine = addressLines.reduce((a, b) => a.length > b.length ? a : b);
        while (ctx.measureText(longestLine).width > paddedWidth && fs > 6) {
            fs -= 0.5;
            ctx.font = `${fs}px "Delius"`;
        }
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const lineHeight = fs * 1.1;
        const totalTextHeight = addressLines.length * lineHeight;
        const longestWidth = Math.max(...addressLines.map((l) => ctx.measureText(l).width));
        const startX = box.x + (box.width - longestWidth) / 2;
        const startY = box.y + (box.height - totalTextHeight) / 2 + lineHeight / 2;
        addressLines.forEach((line, i) => ctx.fillText(line, startX, startY + i * lineHeight));
        ctx.restore();
    });
}

function getAddressLines(member: MemberRow, liveDb?: any): string[] {
    const useClean = liveDb?.address_status === "verified" && liveDb?.clean_line_1;
    if (useClean) {
        return [
            liveDb.clean_addressee || null,
            liveDb.clean_line_1 || null,
            liveDb.clean_line_2 || null,
            [liveDb.clean_city, liveDb.clean_state, liveDb.clean_postal_code]
                .filter(Boolean).join(", ").replace(/, ([^ ])/, " $1") || null,
            liveDb.clean_country || null,
        ].filter(Boolean) as string[];
    }
    return [
        member.addressee !== "—" ? member.addressee : null,
        member.line_1 !== "—" ? member.line_1 : null,
        member.line_2 !== "—" ? member.line_2 : null,
        [member.city, member.state, member.zip]
            .filter((v) => v && v !== "—")
            .join(", ")
            .replace(/, ([^ ])/, " $1") || null,
        member.country !== "—" ? member.country : null,
    ].filter(Boolean) as string[];
}

function EnvelopeCanvas({
    member, templateSrc, widthPct, heightPct, bgColor, onClick, dimmed, dbMemberMap,
}: {
    member: MemberRow; templateSrc: string; widthPct: number; heightPct: number;
    bgColor: string; onClick: () => void; dimmed: boolean; dbMemberMap: Record<string, any>;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImgLoaded(true);
        };
        img.src = templateSrc;
    }, [templateSrc]);

    useEffect(() => {
        if (!imgLoaded) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const liveDb = dbMemberMap[member.id];
        const addressLines = getAddressLines(member, liveDb);
        if (addressLines.length === 0) return;
        drawEnvelope(canvas, img, addressLines, widthPct, heightPct, bgColor);
    }, [imgLoaded, dbMemberMap]);

    return (
        <div
            className={`flex flex-col gap-2 cursor-pointer transition-opacity duration-200 ${dimmed ? "opacity-30" : "opacity-100"}`}
            onClick={onClick}
        >
            <canvas ref={canvasRef} className="w-full rounded-lg border hover:ring-2 hover:ring-primary transition-all" />
            <p className="text-xs text-muted-foreground text-center truncate">{member.full_name}</p>
        </div>
    );
}

const PANEL_WIDTH = 380;
const PANEL_MARGIN = 24; // right-6 = 1.5rem = 24px

function ExpandedEnvelope({
    member, templateSrc, widthPct, heightPct, bgColor, onClose, dbMemberMap, onDbRefresh,
}: {
    member: MemberRow; templateSrc: string; widthPct: number; heightPct: number;
    bgColor: string; onClose: () => void; dbMemberMap: Record<string, any>;
    onDbRefresh: (members: any[]) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const liveDb = dbMemberMap[member.id];

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            setImgLoaded(true);
        };
        img.src = templateSrc;
    }, [templateSrc]);

    useEffect(() => {
        if (!imgLoaded) return;
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        const addressLines = getAddressLines(member, liveDb);
        if (addressLines.length === 0) return;
        drawEnvelope(canvas, img, addressLines, widthPct, heightPct, bgColor);
    }, [imgLoaded, liveDb]);

    // canvas area = screen width minus panel width and margins
    const canvasAreaWidth = `calc(100vw - ${PANEL_WIDTH + PANEL_MARGIN * 3}px)`;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center p-6"
            onClick={onClose}
        >
            {/* Canvas — centered in space left of panel */}
            <div
                className="flex items-center justify-center"
                style={{ width: canvasAreaWidth }}
                onClick={(e) => e.stopPropagation()}  // ← remove this
            >
                <div
                    className="w-full max-w-3xl"
                    onClick={(e) => e.stopPropagation()}  // ← add it here instead
                >
                    <canvas ref={canvasRef} className="w-full rounded-xl shadow-2xl" />
                    <p className="text-sm text-white/70 text-center mt-3">{member.full_name}</p>
                </div>
            </div>

            {/* Address panel — absolutely pinned to right */}
            <div
                className="absolute top-6 right-6 bottom-6 bg-sidebar rounded-xl overflow-y-auto py-3"
                style={{ width: PANEL_WIDTH }}
                onClick={(e) => e.stopPropagation()}
            >
                <MemberAddressPanelContent
                    member={member}
                    dbMemberMap={dbMemberMap}
                    onDbRefresh={onDbRefresh}
                    onClose={onClose}
                />
            </div>
        </div>
    );
}

async function generatePdf(
    members: MemberRow[],
    templateSrc: string,
    widthPct: number,
    heightPct: number,
    dbMemberMap: Record<string, any>,
): Promise<void> {
    // Load the template image once
    const img = await new Promise<HTMLImageElement>((res) => {
        const i = new Image();
        i.onload = () => res(i);
        i.src = templateSrc;
    });

    await document.fonts.load(`16px "Delius"`);

    const offscreen = document.createElement("canvas");
    // PDF page size matches image aspect ratio, in points (72dpi)
    const pdfW = img.naturalWidth / 3;  // scale down: 1px ≈ 0.33pt looks good
    const pdfH = img.naturalHeight / 3;

    const pdf = new jsPDF({
        orientation: pdfW > pdfH ? "landscape" : "portrait",
        unit: "pt",
        format: [pdfW, pdfH],
    });

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const liveDb = dbMemberMap[member.id];
        const addressLines = getAddressLines(member, liveDb);
        if (addressLines.length === 0) continue;

        // Draw onto offscreen canvas with transparent background
        await drawEnvelope(offscreen, img, addressLines, widthPct, heightPct, "rgba(0,0,0,0)");

        // Export as PNG (supports transparency)
        const dataUrl = offscreen.toDataURL("image/png");

        if (i > 0) pdf.addPage([pdfW, pdfH]);
        pdf.addImage(dataUrl, "PNG", 0, 0, pdfW, pdfH);
    }

    pdf.save("envelopes.pdf");
}

export function EnvelopesPreviewPage({ dbMembers, onDbRefresh }: Props) {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as PreviewState | null;
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const dbMemberMap = useMemo(
        () => Object.fromEntries(dbMembers.map((m) => [m.id, m])),
        [dbMembers],
    );

    if (!state) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">No preview data found.</p>
                <Button onClick={() => navigate("/envelopes")}>Back to Envelopes</Button>
            </div>
        );
    }

    const { templateSrc, widthPct, heightPct, bgColor, members } = state;
    const expandedMember = members.find((m) => m.id === expandedId) ?? null;

    const handleSave = async () => {
        setSaving(true);
        try {
            await generatePdf(members, templateSrc, widthPct, heightPct, dbMemberMap);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Sticky header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/envelopes")}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <h1 className="text-2xl font-semibold">Preview</h1>
                    <p className="text-sm text-muted-foreground">{members.length} envelopes</p>
                </div>
                <Button className="h-10" disabled={saving} onClick={handleSave}>
                    {saving ? "Saving…" : "Save PDF"}
                </Button>
            </div>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-autohide p-8">
                <div className="grid grid-cols-3 gap-6">
                    {members.map((member) => (
                        <EnvelopeCanvas
                            key={member.id}
                            member={member}
                            templateSrc={templateSrc}
                            widthPct={widthPct}
                            heightPct={heightPct}
                            bgColor={bgColor}
                            onClick={() => setExpandedId(member.id)}
                            dimmed={expandedId !== null && expandedId !== member.id}
                            dbMemberMap={dbMemberMap}
                        />
                    ))}
                </div>
            </div>

            {expandedMember && (
                <ExpandedEnvelope
                    member={expandedMember}
                    templateSrc={templateSrc}
                    widthPct={widthPct}
                    heightPct={heightPct}
                    bgColor={bgColor}
                    onClose={() => setExpandedId(null)}
                    dbMemberMap={dbMemberMap}
                    onDbRefresh={onDbRefresh}
                />
            )}
        </div>
    );
}