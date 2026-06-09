import { useRef, useCallback, useEffect, useMemo } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  filterMembersByRange,
  buildTableRow,
  MONTHS,
  YEARS,
} from "@/lib/patreon";
import { usePackedMembers } from "@/hooks/usePackedMembers";
import { useMembersContext } from "@/context/MembersContext"

type BoundingBox = { x: number; y: number; width: number; height: number };

const SAMPLE_ADDRESS = [
  "Alexandria Worthington-Blackwell",
  "4892 Summerfield Boulevard NW, APT 312B",
  "Baton Rouge, LA 70808-4521",
  "UNITED STATES",
];

interface Props {
  template: string | null;
  onTemplateChange: (v: string | null) => void;
  bgColor: string;
  onBgColorChange: (v: string) => void;
  widthPct: number;
  onWidthPctChange: (v: number) => void;
  heightPct: number;
  onHeightPctChange: (v: number) => void;
  selectedMonth: string;
  onMonthChange: (v: string) => void;
  selectedYear: string;
  onYearChange: (v: string) => void;
  selectedTier: string;
  onTierChange: (v: string) => void;
}

export function EnvelopesPage({
  template, onTemplateChange: setTemplate,
  bgColor, onBgColorChange: setBgColor,
  widthPct, onWidthPctChange: setWidthPct,
  heightPct, onHeightPctChange: setHeightPct,
  selectedMonth, onMonthChange: setSelectedMonth,
  selectedYear, onYearChange: setSelectedYear,
  selectedTier, onTierChange: setSelectedTier,
}: Props) {
  const { members, included, dbMembers } = useMembersContext();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dateRange = useMemo(
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

  const { filteredMembers, tierTitles } = useMemo(() => {
    const inRange = filterMembersByRange(members, included, dateRange);
    const verifiedInRange = inRange.filter(
      (m) =>
        dbMembers.find((db) => db.id === m.id)?.address_status === "verified",
    );
    const tiers = new Set(
      verifiedInRange.map((m) => m._tierTitle).filter((t) => t && t !== "—"),
    );
    const filtered =
      selectedTier === "all"
        ? verifiedInRange
        : verifiedInRange.filter((m) => m._tierTitle === selectedTier);
    return {
      filteredMembers: filtered,
      tierTitles: Array.from(tiers).sort() as string[],
    };
  }, [members, included, dateRange, dbMembers, selectedTier]);

  const { packedIds } = usePackedMembers(selectedYear, selectedMonth);

  const getBox = useCallback(
    (img: HTMLImageElement, wPct: number, hPct: number): BoundingBox => {
      const w = img.naturalWidth * (wPct / 100);
      const h = img.naturalHeight * (hPct / 100);
      return {
        x: (img.naturalWidth - w) / 2,
        y: (img.naturalHeight - h) / 2,
        width: w,
        height: h,
      };
    },
    [],
  );

  const renderCanvas = useCallback(
    (img: HTMLImageElement, wPct: number, hPct: number, bg: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const box = getBox(img, wPct, hPct);
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
      ctx.lineWidth = 6;
      ctx.setLineDash([]);
      const r = 12;
      ctx.beginPath();
      ctx.moveTo(box.x + r, box.y);
      ctx.lineTo(box.x + box.width - r, box.y);
      ctx.arcTo(box.x + box.width, box.y, box.x + box.width, box.y + r, r);
      ctx.lineTo(box.x + box.width, box.y + box.height - r);
      ctx.arcTo(
        box.x + box.width,
        box.y + box.height,
        box.x + box.width - r,
        box.y + box.height,
        r,
      );
      ctx.lineTo(box.x + r, box.y + box.height);
      ctx.arcTo(box.x, box.y + box.height, box.x, box.y + box.height - r, r);
      ctx.lineTo(box.x, box.y + r);
      ctx.arcTo(box.x, box.y, box.x + r, box.y, r);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      ctx.save();
      let fontSize = box.height / 7;
      ctx.font = `${fontSize}px "Delius"`;
      const paddedWidth = box.width;
      const longestLine = SAMPLE_ADDRESS.reduce((a, b) =>
        a.length > b.length ? a : b,
      );
      while (ctx.measureText(longestLine).width > paddedWidth && fontSize > 6) {
        fontSize -= 0.5;
        ctx.font = `${fontSize}px "Delius"`;
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      const lineHeight = fontSize * 1.1;
      const totalTextHeight = SAMPLE_ADDRESS.length * lineHeight;
      const longestWidth = Math.max(
        ...SAMPLE_ADDRESS.map((line) => ctx.measureText(line).width),
      );
      const startX = box.x + (box.width - longestWidth) / 2;
      const startY =
        box.y + (box.height - totalTextHeight) / 2 + lineHeight / 2;
      SAMPLE_ADDRESS.forEach((line, i) => {
        ctx.fillText(line, startX, startY + i * lineHeight);
      });
      ctx.restore();
    },
    [getBox],
  );

  const redraw = useCallback(
    (overrides: Partial<{ wPct: number; hPct: number; bg: string }> = {}) => {
      if (!imageRef.current) return;
      renderCanvas(
        imageRef.current,
        overrides.wPct ?? widthPct,
        overrides.hPct ?? heightPct,
        overrides.bg ?? bgColor,
      );
    },
    [widthPct, heightPct, bgColor, renderCanvas],
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setTemplate(src);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        document.fonts.load(`bold 40px "Delius"`).then(() => {
          renderCanvas(img, widthPct, heightPct, bgColor);
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!template) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      document.fonts.load(`bold 40px "Delius"`).then(() => {
        renderCanvas(img, widthPct, heightPct, bgColor);
      });
    };
    img.src = template;
  }, []);

  const box = imageRef.current
    ? getBox(imageRef.current, widthPct, heightPct)
    : null;
    const canProceed = template && filteredMembers.filter((m) => !packedIds.has(m.id)).length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    const dbMemberMap = Object.fromEntries(dbMembers.map((m) => [m.id, m]));
    const membersWithAddresses = filteredMembers
      .filter((m) => !packedIds.has(m.id))  // ← exclude already packed
      .map((m) => buildTableRow(m, included, dbMemberMap[m.id]));
    navigate("/envelopes/preview", {
      state: {
        templateSrc: template,
        widthPct,
        heightPct,
        bgColor,
        members: membersWithAddresses,
      },
    });
  };

  return (
    <div className="flex h-full w-full gap-0 overflow-hidden">
      {!template ? (
        // Full-width uploader
        <div className="flex-1 flex items-center justify-center p-8">
          <div
            className="w-full max-w-2xl border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">Upload envelope template</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP supported
              </p>
            </div>
            <Button variant="outline" size="sm">
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </div>
        </div>
      ) : (
        <>
          {/* Card — controls only */}
          <Card className="w-72 shrink-0 h-[calc(100%-3rem)] m-6 mr-0 flex flex-col overflow-hidden ring-0 py-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h1 className="text-base font-medium">Envelopes</h1>
              {template && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => {
                    setTemplate(null);
                    imageRef.current = null;
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Remove
                </Button>
              )}
            </div>

            {/* Scrollable body */}
            <div className="flex flex-col gap-5 px-6 py-5 flex-1 min-h-0">
              {!template ? (
                <div
                  className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                  onClick={() => inputRef.current?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.dataTransfer.files[0] &&
                      handleFile(e.dataTransfer.files[0]);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="rounded-full bg-muted p-3">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Upload template</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Browse
                  </Button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Width</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={widthPct}
                          onChange={(e) => {
                            const v = Math.min(
                              100,
                              Math.max(10, parseInt(e.target.value) || 10),
                            );
                            setWidthPct(v);
                            redraw({ wPct: v });
                          }}
                          className="w-12 text-right text-sm border border-border rounded px-1 py-0.5 bg-background"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Slider
                      min={10}
                      max={100}
                      step={1}
                      value={[widthPct]}
                      onValueChange={([v]) => {
                        setWidthPct(v);
                        redraw({ wPct: v });
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Height</p>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={10}
                          max={100}
                          value={heightPct}
                          onChange={(e) => {
                            const v = Math.min(
                              100,
                              Math.max(10, parseInt(e.target.value) || 10),
                            );
                            setHeightPct(v);
                            redraw({ hPct: v });
                          }}
                          className="w-12 text-right text-sm border border-border rounded px-1 py-0.5 bg-background"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Slider
                      min={10}
                      max={100}
                      step={1}
                      value={[heightPct]}
                      onValueChange={([v]) => {
                        setHeightPct(v);
                        redraw({ hPct: v });
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Background</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => {
                          setBgColor(e.target.value);
                          redraw({ bg: e.target.value });
                        }}
                        className="h-8 w-8 cursor-pointer rounded border border-border p-0.5"
                      />
                      <span className="text-xs text-muted-foreground font-mono">
                        {bgColor}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setBgColor("#ffffff");
                          redraw({ bg: "#ffffff" });
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>

                  {box && (
                    <div className="text-xs text-muted-foreground border rounded p-3 flex flex-col gap-1">
                      <p className="font-medium text-foreground">
                        Box dimensions
                      </p>
                      <p>
                        {Math.round(box.width)} × {Math.round(box.height)} px
                      </p>
                      <p>
                        Offset: {Math.round(box.x)}, {Math.round(box.y)}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-border" />

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Month</p>
                    <div className="flex gap-2">
                      <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={y}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Tier</p>
                    <Select
                      value={selectedTier}
                      onValueChange={setSelectedTier}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All tiers</SelectItem>
                        {tierTitles.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Members list */}
                  <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Members</p>
                      <span className="text-xs text-muted-foreground">
                        {filteredMembers.filter((m) => !packedIds.has(m.id)).length} / {filteredMembers.length}
                      </span>
                    </div>
                    <div className="border rounded-lg overflow-y-auto flex-1 min-h-0 bg-background scrollbar-thin scrollbar-autohide">
                      {filteredMembers.filter((m) => !packedIds.has(m.id)).length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-3">
                          No verified members for this selection.
                        </p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {filteredMembers.filter((m) => !packedIds.has(m.id)).map((m) => (
                            <li key={m.id} className="px-3 py-2 text-sm">
                              {m.attributes?.full_name ?? "—"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Next button pinned to bottom */}
            {template && (
              <div className="px-6 py-4 border-t border-border flex items-center">
                <Button className="w-full" disabled={!canProceed} onClick={handleNext}>
                  Next
                </Button>
              </div>
            )}
          </Card>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full rounded-lg shadow-sm"
            />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
