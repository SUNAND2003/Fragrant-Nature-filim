import { useRef, useState, type ReactNode } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
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
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-none border border-border bg-background px-4 py-3">
      <span className="font-sans text-xs font-bold uppercase tracking-widest">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 border transition-colors",
          checked ? "border-neon bg-neon" : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 bg-foreground transition-transform",
            checked ? "translate-x-6" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
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
}: {
  value: string;
  onChange: (url: string) => void;
  kind?: string;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative h-40 w-28 shrink-0 overflow-hidden border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
              No image
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => void pick(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            <Upload /> {busy ? "Uploading…" : "Upload image"}
          </Button>
          <p className="font-sans text-xs text-muted-foreground">…or paste an image URL</p>
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
