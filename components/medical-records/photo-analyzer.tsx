"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Sparkles,
  Loader2,
  X,
  ScanLine,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  observaciones: string;
  score: number;
  recomendaciones: string;
  resumen: string;
}

interface Props {
  treatment?: string;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function ImageDropZone({
  label,
  badge,
  image,
  onImage,
  onClear,
}: {
  label: string;
  badge: string;
  image: string | null;
  onImage: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se admiten archivos de imagen");
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const MAX = 512;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        onImage(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = objectUrl;
    },
    [onImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
          {badge}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>

      {image ? (
        <div className="relative rounded-xl overflow-hidden aspect-square bg-muted group">
          <img
            src={image}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            aria-label={`Eliminar foto ${label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            dragging
              ? "border-primary/60 bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <p className="text-xs text-muted-foreground text-center px-3 leading-relaxed">
            Haz clic o arrastra
            <br />
            una foto
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Score Meter ──────────────────────────────────────────────────────────────
function ScoreMeter({ score }: { score: number }) {
  const colorText =
    score >= 75
      ? "text-emerald-600 dark:text-emerald-400"
      : score >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-500 dark:text-red-400";
  const colorBar =
    score >= 75
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-red-500";
  const label =
    score >= 75 ? "Excelente" : score >= 50 ? "Moderado" : "Leve";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Efectividad visible</span>
        <span className={`text-sm font-bold tabular-nums ${colorText}`}>
          {score}% · {label}
        </span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorBar}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PhotoAnalyzer({ treatment, onAnalysisComplete }: Props) {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const bothImages = !!beforeImage && !!afterImage;

  const clearAnalysis = () => setAnalysis(null);

  const handleAnalyze = async () => {
    if (!beforeImage || !afterImage) return;
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeImage, afterImage, treatment }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        analysis?: AnalysisResult;
      };

      if (!res.ok || data.error) {
        toast.error(data.error ?? "Error al analizar las imágenes");
        return;
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
        toast.success("Análisis completado");
      }
    } catch {
      toast.error("Error de conexión al analizar");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Upload zones */}
      <div className="flex gap-4">
        <ImageDropZone
          label="Foto inicial"
          badge="Antes"
          image={beforeImage}
          onImage={(url) => {
            setBeforeImage(url);
            clearAnalysis();
          }}
          onClear={() => {
            setBeforeImage(null);
            clearAnalysis();
          }}
        />
        <ImageDropZone
          label="Foto resultado"
          badge="Después"
          image={afterImage}
          onImage={(url) => {
            setAfterImage(url);
            clearAnalysis();
          }}
          onClear={() => {
            setAfterImage(null);
            clearAnalysis();
          }}
        />
      </div>

      {/* Comparison slider */}
      {bothImages && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
            Comparador interactivo
          </p>

          <div className="relative w-full rounded-xl overflow-hidden bg-muted select-none"
            style={{ aspectRatio: "4/3" }}
          >
            {/* After image — base layer */}
            <img
              src={afterImage}
              alt="Después"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />

            {/* Before image — clipped via clip-path */}
            <img
              src={beforeImage}
              alt="Antes"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              draggable={false}
            />

            {/* Labels */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Antes
              </span>
            </div>
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                Después
              </span>
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.4)] pointer-events-none"
              style={{ left: `calc(${sliderPos}% - 0.5px)` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
                <ChevronLeft className="w-3 h-3 text-gray-600" aria-hidden="true" />
                <ChevronRight className="w-3 h-3 text-gray-600" aria-hidden="true" />
              </div>
            </div>

            {/* Invisible range input — handles all drag/touch */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              aria-label="Posición del comparador"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Arrastra para comparar antes y después
          </p>
        </div>
      )}

      {/* Analyze button */}
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!bothImages || isAnalyzing}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white py-2.5 text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Analizando con IA...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Analizar cambios con IA
          </>
        )}
      </button>

      {/* Analysis results */}
      {analysis && (
        <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <CheckCircle2
              className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              Análisis clínico generado por IA
            </p>
          </div>

          {/* Resumen */}
          <p className="text-sm text-foreground/80 italic leading-relaxed border-l-2 border-violet-300 dark:border-violet-700 pl-3">
            {analysis.resumen}
          </p>

          {/* Score */}
          <ScoreMeter score={analysis.score} />

          {/* Observaciones */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Observaciones clínicas
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {analysis.observaciones}
            </p>
          </div>

          {/* Recomendaciones */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recomendaciones
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {analysis.recomendaciones}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
