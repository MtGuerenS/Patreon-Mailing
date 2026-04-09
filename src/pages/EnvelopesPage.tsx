import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

type BoundingBox = { x: number; y: number; width: number; height: number };

const SAMPLE_ADDRESS = [
  "Alexandria Worthington-Blackwell",
  "4892 Summerfield Boulevard NW",
  "Apartment 312B",
  "Baton Rouge, LA 70808-4521",
  "UNITED STATES",
];

export function EnvelopesPage() {
  const [template, setTemplate] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [widthPct, setWidthPct] = useState(39);
  const [heightPct, setHeightPct] = useState(23);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      // Redraw image inside box (so it's not darkened)
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      ctx.restore();

      // Box border — solid black with rounded corners
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

      // Sample address — left-aligned, centered by longest line
      ctx.save();
      let fontSize = box.height / 7;
      ctx.font = `${fontSize}px "Delius"`;

      // Shrink font until longest line fits within box width (with padding)
      const paddedWidth = box.width * 1;
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
    redraw();
  }, []);

  const box = imageRef.current
    ? getBox(imageRef.current, widthPct, heightPct)
    : null;

  return (
    <div className="flex flex-col gap-6 p-8 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Envelopes</h1>
        {template && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTemplate(null);
              imageRef.current = null;
            }}
          >
            <X className="h-4 w-4 mr-1" /> Remove template
          </Button>
        )}
      </div>

      {!template ? (
        <div
          className="border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
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
      ) : (
        <div className="flex gap-6">
          {/* Controls */}
          <div className="flex flex-col gap-5 w-64 shrink-0">
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

            {box && imageRef.current && (
              <div className="text-xs text-muted-foreground border rounded p-3 flex flex-col gap-1">
                <p className="font-medium text-foreground">Box dimensions</p>
                <p>
                  {Math.round(box.width)} × {Math.round(box.height)} px
                </p>
                <p>
                  Offset: {Math.round(box.x)}, {Math.round(box.y)}
                </p>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="border rounded-lg overflow-hidden max-w-[50vw]">
            <canvas ref={canvasRef} className="w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
