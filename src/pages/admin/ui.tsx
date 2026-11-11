import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Upload, Video } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { getTrailerEmbedUrl, isDirectVideoUrl } from "@/lib/films";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Page heading used by every admin section. */
export function PageHead({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="font-display text-4xl uppercase leading-none md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl font-sans text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="font-sans text-xs font-bold uppercase tracking-widest">
        {label}
      </Label>
      {children}
      {hint && <p className="font-sans text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "h-11 rounded-none border-border bg-background font-sans text-sm focus-visible:ring-neon-ink";

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      {...props}
      className={cn(
        "min-h-28 rounded-none border-border bg-background font-sans text-sm",
        props.className,
      )}
    />
  );
}

/** Native select — dependable across platforms and keyboard/screen-reader friendly. */
export function SelectInput({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      className={cn(inputClass, "cursor-pointer pr-8", className)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SwitchInput({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      tabIndex={0}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "group flex cursor-pointer items-center justify-between gap-4 rounded-none border px-4 py-3.5 transition-all select-none",
        checked
          ? "border-neutral-900 bg-neutral-900/[0.04] text-foreground shadow-2xs"
          : "border-border bg-background text-muted-foreground hover:border-foreground/40",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "font-sans text-xs font-bold uppercase tracking-wider transition-colors",
            checked ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors",
            checked
              ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
              : "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
          )}
        >
          {checked ? "ON" : "OFF"}
        </span>
      </div>

      <div
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out",
          checked
            ? "bg-neutral-900 dark:bg-white"
            : "bg-neutral-300 dark:bg-neutral-700",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out dark:bg-black",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </div>
    </div>
  );
}

/**
 * Poster/artwork uploader: picks a local file, sends it to `POST /api/upload`
 * (Cloudinary when configured, otherwise the local `/uploads` folder) and
 * reports back the URL. A URL can still be pasted by hand.
 */
export function ImagePicker({
  value,
  onChange,
  kind = "misc",
  label = "Image",
  recommendedSize,
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: string;
  label?: string;
  recommendedSize?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [busy, setBusy] = useState(false);
  const [fitMode, setFitMode] = useState<"contain" | "cover">(
    kind === "banner" || kind === "still" || kind === "news" ? "cover" : "contain",
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (!value) {
      setDims(null);
      return;
    }
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setDims({ w: img.naturalWidth, h: img.naturalHeight });
    } else {
      setDims(null);
    }
  }, [value]);

  const sizeHint =
    recommendedSize ??
    (kind === "poster"
      ? "1000 × 1500 px (2:3 portrait)"
      : kind === "banner"
      ? "1920 × 1080 px (16:9) or 2048 × 930 px (21:9)"
      : kind === "still"
      ? "1280 × 720 px (16:9 widescreen)"
      : kind === "coming-soon"
      ? "1000 × 1500 px (2:3 poster)"
      : kind === "news"
      ? "1600 × 900 px (16:9 widescreen)"
      : kind === "gallery"
      ? "1920 × 1200 px (16:10 cinema)"
      : "1920 × 1080 px");

  const containerRatio =
    kind === "poster" || kind === "coming-soon"
      ? "h-44 w-32 aspect-[2/3]"
      : kind === "banner"
      ? "h-24 w-52 aspect-[21/9]"
      : kind === "still" || kind === "news"
      ? "h-28 w-52 aspect-video"
      : kind === "gallery"
      ? "h-28 w-44 aspect-[16/10]"
      : "h-32 w-44 aspect-video";

  const evaluateSize = (w: number, h: number) => {
    const ratio = w / h;
    const orient = ratio < 0.9 ? "Portrait" : ratio > 1.1 ? "Landscape" : "Square";
    if (kind === "poster") {
      if (ratio > 1.05) {
        return {
          status: "warning" as const,
          orient,
          message: `Landscape image (${w}×${h}). Posters are vertical (2:3 portrait, e.g. 1000×1500). If this is wide artwork, upload it to Hero Banner instead.`,
        };
      }
      if (w < 500 || h < 700) {
        return {
          status: "warning" as const,
          orient,
          message: `Low resolution (${w}×${h}). Recommended at least 1000 × 1500 px for sharp cards.`,
        };
      }
      return {
        status: "ok" as const,
        orient,
        message: `Perfect portrait fit (${w} × ${h} px)`,
      };
    }
    if (kind === "banner") {
      if (ratio < 1.2) {
        return {
          status: "warning" as const,
          orient,
          message: `${orient} image (${w}×${h}). Hero banners fill wide screens and need 16:9 or 21:9 landscape (e.g. 1920×1080 or 2048×930).`,
        };
      }
      if (w < 1000) {
        return {
          status: "warning" as const,
          orient,
          message: `Low width (${w}×${h}). Recommended at least 1920 × 1080 px for crisp fullscreen hero.`,
        };
      }
      return {
        status: "ok" as const,
        orient,
        message: `Ideal hero banner size (${w} × ${h} px)`,
      };
    }
    if (kind === "coming-soon") {
      if (ratio > 1.05) {
        return {
          status: "warning" as const,
          orient,
          message: `Landscape image (${w}×${h}). The Coming Soon stage uses a vertical normal poster frame (2:3 portrait, e.g. 1000×1500 px); wide artwork will have top/bottom bars.`,
        };
      }
      if (w < 500 || h < 700) {
        return {
          status: "warning" as const,
          orient,
          message: `Low resolution (${w}×${h}). Recommended ${sizeHint} for a crisp Coming Soon poster.`,
        };
      }
      return {
        status: "ok" as const,
        orient,
        message: `Great 2:3 Coming Soon poster fit (${w} × ${h} px)`,
      };
    }

    if (kind === "still" || kind === "news" || kind === "gallery") {
      if (ratio < 1.0) {
        return {
          status: "warning" as const,
          orient,
          message: `Portrait image (${w}×${h}). This area uses a horizontal frame; upload a 16:9 landscape image to fit without bars.`,
        };
      }
      if (w < 640) {
        return {
          status: "warning" as const,
          orient,
          message: `Low resolution (${w}×${h}). Recommended ${sizeHint}.`,
        };
      }
      return {
        status: "ok" as const,
        orient,
        message: `Great landscape fit (${w} × ${h} px)`,
      };
    }
    return {
      status: "ok" as const,
      orient,
      message: `${w} × ${h} px (${orient})`,
    };
  };

  const evaluation = dims ? evaluateSize(dims.w, dims.h) : null;

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const media = await api.upload<{ url: string }>("/api/upload", file, { kind });
      onChange(media.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-4">
        {/* Responsive smart preview box with drag & drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
          className={`relative ${containerRatio} shrink-0 overflow-hidden border transition-colors ${
            isDragOver
              ? "border-neon ring-2 ring-neon/40 bg-neutral-900"
              : "border-border bg-neutral-950"
          } flex flex-col items-center justify-center text-center shadow-inner group`}
        >
          {value ? (
            <>
              <img
                key={value}
                ref={imgRef}
                src={value}
                alt=""
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setDims({ w: img.naturalWidth, h: img.naturalHeight });
                  }
                }}
                onError={() => setDims(null)}
                className={`h-full w-full max-h-full max-w-full ${
                  fitMode === "contain" ? "object-contain" : "object-cover"
                } object-center transition-all duration-300`}
              />
              {/* Fit mode toggle in hover overlay */}
              <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setFitMode((m) => (m === "contain" ? "cover" : "contain"))}
                  className="rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur hover:bg-neutral-800"
                  title="Toggle fit between Contain (full image) and Cover (fill frame)"
                >
                  {fitMode}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
              <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                No image
              </span>
              <span className="font-mono text-[9px] text-muted-foreground/75 leading-tight">
                {kind === "poster"
                  ? "2:3 Portrait"
                  : kind === "banner"
                  ? "16:9 / 21:9 Wide"
                  : kind === "still" || kind === "news"
                  ? "16:9 Widescreen"
                  : kind === "coming-soon"
                  ? "2:3 Poster"
                  : "16:10 Cinema"}
              </span>
            </div>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
              <Loader2 className="h-6 w-6 animate-spin text-neon-ink" />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 min-w-[220px] flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml,image/*"
            className="hidden"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-none font-sans text-xs font-bold uppercase tracking-wide cursor-pointer"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" /> {busy ? "Uploading…" : "Upload image"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-none font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-destructive cursor-pointer"
                onClick={() => onChange("")}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground/70 uppercase tracking-wider text-[10px]">
              Recommended:
            </span>
            <span className="rounded border border-border bg-muted/80 px-2 py-0.5 font-bold text-foreground">
              {sizeHint}
            </span>
          </div>

          {dims && evaluation && (
            <div
              className={cn(
                "flex items-start gap-2 rounded border px-2.5 py-1.5 font-sans text-xs leading-snug",
                evaluation.status === "warning"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              )}
            >
              {evaluation.status === "warning" ? (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              )}
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  Detected: {dims.w} × {dims.h} px ({evaluation.orient})
                </p>
                <p className="mt-0.5 text-[11px]">{evaluation.message}</p>
              </div>
            </div>
          )}

          <p className="font-sans text-xs text-muted-foreground">…or paste a direct image URL below</p>
        </div>
      </div>

      <TextInput
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://…"
        aria-label={`${label} URL`}
      />
    </div>
  );
}

/**
 * Trailer / video uploader paired with a direct URL input: accepts MP4/WebM/MOV
 * uploads via `POST /api/upload` (kind: "video") OR pasted YouTube/Vimeo/MP4 URLs.
 */
export function VideoPicker({
  id,
  value,
  onChange,
  label = "Trailer",
}: {
  id?: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [meta, setMeta] = useState<{ w: number; h: number; duration: number } | null>(null);

  useEffect(() => {
    setMeta(null);
  }, [value]);

  const isVideoFile = isDirectVideoUrl(value);
  const embedUrl = !isVideoFile ? getTrailerEmbedUrl(value) : null;

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const media = await api.upload<{ url: string }>("/api/upload", file, { kind: "video" });
      onChange(media.url);
      toast.success("Trailer video uploaded");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Video upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || !Number.isFinite(sec)) return "";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const videoWarning =
    meta && meta.w > 0 && meta.h > 0
      ? meta.w < meta.h
        ? `Portrait video (${meta.w}×${meta.h}). Trailers play inside a 16:9 widescreen player (recommended 1920 × 1080 px).`
        : meta.w < 720
        ? `Low resolution (${meta.w}×${meta.h}). Recommended 1920 × 1080 px (Full HD) MP4.`
        : null
      : null;

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.ogv"
        className="hidden"
        onChange={(event) => void pick(event.target.files?.[0])}
      />

      {/* URL input beside Upload MP4 button */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <TextInput
          id={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=… or upload .mp4"
          aria-label={`${label} URL`}
          className="min-w-0 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 rounded-none font-sans text-xs font-bold uppercase tracking-wide cursor-pointer"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : "Upload MP4"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 shrink-0 rounded-none font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={() => onChange("")}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Size/format bar */}
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground/70 uppercase tracking-wider text-[10px]">
          Recommended:
        </span>
        <span className="rounded border border-border bg-muted/80 px-2 py-0.5 font-bold text-foreground">
          1920 × 1080 px (16:9) · MP4 / WEBM / MOV (up to 150 MB)
        </span>
      </div>

      {/* Preview / Drop area */}
      {isVideoFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "relative aspect-video w-full overflow-hidden border bg-black transition-colors",
            isDragOver ? "border-neon ring-2 ring-neon/40" : "border-border",
          )}
        >
          <video
            key={value}
            src={value}
            controls
            preload="metadata"
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (v.videoWidth && v.videoHeight) {
                setMeta({ w: v.videoWidth, h: v.videoHeight, duration: v.duration });
              }
            }}
            className="h-full w-full max-h-full max-w-full object-contain bg-black"
          />
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
              <Loader2 className="h-6 w-6 animate-spin text-neon-ink" />
            </span>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            void pick(e.dataTransfer.files?.[0]);
          }}
          onClick={() => !busy && fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !busy) {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-3 border border-dashed px-3.5 py-2.5 font-sans text-xs transition-colors",
            isDragOver
              ? "border-neon bg-neutral-900/60 ring-2 ring-neon/30"
              : "border-border bg-background/50 hover:border-foreground/40",
          )}
        >
          <div className="flex items-center gap-2.5 text-muted-foreground min-w-0">
            <Video className="h-4 w-4 shrink-0 text-foreground/70" />
            <span className="truncate">
              {embedUrl
                ? "External YouTube / Vimeo link connected (or drop an .mp4 file to replace)"
                : "Drag & drop an .mp4 video file here, or paste a YouTube / Vimeo URL above"}
            </span>
          </div>
          {busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neon-ink" />}
        </div>
      )}

      {meta && meta.w > 0 && meta.h > 0 && (
        <div
          className={cn(
            "flex items-start gap-2 rounded border px-2.5 py-1.5 font-sans text-xs leading-snug",
            videoWarning
              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          )}
        >
          {videoWarning ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
          )}
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
              Video: {meta.w} × {meta.h} px{meta.duration ? ` · ${formatDuration(meta.duration)}` : ""}
            </p>
            <p className="mt-0.5 text-[11px]">
              {videoWarning ?? "Ideal widescreen MP4 trailer fit."}
            </p>
          </div>
        </div>
      )}

      {embedUrl && (
        <div className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 font-sans text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>Valid YouTube / Vimeo embed detected — plays inside the site trailer modal.</span>
        </div>
      )}
    </div>
  );
}

/** Delete/cancel action with a native confirmation step. */
export function ConfirmButton({
  label = "Delete",
  confirmMessage,
  onConfirm,
  variant = "destructive",
}: {
  label?: string;
  confirmMessage: string;
  onConfirm: () => void | Promise<void>;
  variant?: "destructive" | "outline";
}) {
  const [busy, setBusy] = useState(false);
  const click = async () => {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      className="rounded-none"
      disabled={busy}
      onClick={() => void click()}
    >
      {busy && <Loader2 className="animate-spin" />}
      {label}
    </Button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="border border-dashed border-border px-6 py-12 text-center font-sans text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Reads an error thrown by the API client into a toast. */
export function reportError(error: unknown, fallback = "Something went wrong") {
  toast.error(error instanceof ApiError ? error.message : fallback);
}
