import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { defaultSettings, useContent, type Settings } from "@/lib/content";
import { useAdminAuth } from "@/pages/admin/auth";
import { Button } from "@/components/ui/button";
import { ConfirmButton, Field, PageHead, TextArea, TextInput, reportError } from "@/pages/admin/ui";

type SettingField = { key: string; label: string; type: "text" | "email" | "url" | "textarea" };

const FIELDS: SettingField[] = [
  { key: "siteName", label: "Site name", type: "text" },
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "youtube", label: "YouTube", type: "url" },
  { key: "instagram", label: "Instagram", type: "url" },
  { key: "facebook", label: "Facebook", type: "url" },
  { key: "footerNote", label: "Footer note", type: "textarea" },
];

export function SettingsSection() {
  const { settings, refresh } = useContent();
  const { admin } = useAdminAuth();
  const [form, setForm] = useState<Settings>(settings);
  const [busy, setBusy] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Follow the shared map as it loads and after every save/reset.
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const textFields = FIELDS.filter((field) => field.type !== "textarea");
  const noteFields = FIELDS.filter((field) => field.type === "textarea");

  const update = (key: string, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    // Send only what actually changed — untouched keys keep their stored values.
    const changed: Record<string, string> = {};
    for (const field of FIELDS) {
      const value = form[field.key] ?? "";
      if (value !== (settings[field.key] ?? "")) changed[field.key] = value;
    }
    if (Object.keys(changed).length === 0) {
      toast.success("Settings are already up to date");
      return;
    }
    setBusy(true);
    try {
      await api.put("/api/settings", changed, { auth: true });
      await refresh();
      toast.success("Settings saved");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await api.put("/api/settings", defaultSettings, { auth: true });
      await refresh();
      toast.success("Settings reset to defaults");
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPasswordBusy(true);
    try {
      await api.put(
        "/api/auth/password",
        { currentPassword: passwords.current, newPassword: passwords.next },
        { auth: true },
      );
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password updated");
    } catch (error) {
      reportError(error);
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <>
      <PageHead
        title="Settings"
        description="Contact details, social links and footer copy used across the public site, plus the password for this panel."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          onSubmit={(event) => void save(event)}
          className="space-y-5 border border-border bg-card p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-xl uppercase">Site settings</p>
            <ConfirmButton
              label="Reset to defaults"
              variant="outline"
              confirmMessage="Reset every setting back to the built-in defaults?"
              onConfirm={reset}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {textFields.map((field) => (
              <Field key={field.key} label={field.label} htmlFor={`site-${field.key}`}>
                <TextInput
                  id={`site-${field.key}`}
                  type={field.type}
                  value={form[field.key] ?? ""}
                  onChange={(event) => update(field.key, event.target.value)}
                />
              </Field>
            ))}
          </div>

          {noteFields.map((field) => (
            <Field key={field.key} label={field.label} htmlFor={`site-${field.key}`}>
              <TextArea
                id={`site-${field.key}`}
                value={form[field.key] ?? ""}
                onChange={(event) => update(field.key, event.target.value)}
              />
            </Field>
          ))}

          <div className="flex items-center gap-3">
            <Button type="submit" className="rounded-none" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />}
              Save settings
            </Button>
            <span className="font-sans text-xs text-muted-foreground">
              Only changed values are sent.
            </span>
          </div>
        </form>

        <form
          onSubmit={(event) => void changePassword(event)}
          className="space-y-5 border border-border bg-card p-5"
        >
          <p className="flex items-center gap-2 font-display text-xl uppercase">
            <KeyRound className="h-5 w-5 text-neon-ink" /> Admin password
          </p>

          <div className="flex items-center justify-between gap-3 border border-border bg-background px-4 py-3">
            <span className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Signed in as
            </span>
            <span className="truncate font-sans text-sm">{admin ? admin.email : "—"}</span>
          </div>

          <Field label="Current password" htmlFor="pw-current">
            <TextInput
              id="pw-current"
              type="password"
              required
              autoComplete="current-password"
              value={passwords.current}
              onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
            />
          </Field>

          <Field label="New password" htmlFor="pw-new" hint="At least 8 characters.">
            <TextInput
              id="pw-new"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={passwords.next}
              onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
            />
          </Field>

          <Field label="Confirm new password" htmlFor="pw-confirm">
            <TextInput
              id="pw-confirm"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
            />
          </Field>

          <Button type="submit" className="w-full rounded-none" disabled={passwordBusy}>
            {passwordBusy && <Loader2 className="animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </>
  );
}
