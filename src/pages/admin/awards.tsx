import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { Award } from "@/lib/films";
import { Button } from "@/components/ui/button";
import {
  ConfirmButton,
  EmptyState,
  Field,
  PageHead,
  SelectInput,
  TextArea,
  TextInput,
  reportError,
} from "@/pages/admin/ui";

/** The API adds `_id`, which is what PUT/DELETE address. */
type AdminAward = Award & { _id: string; createdAt?: string };

const CATEGORIES = ["Major Prize", "Selection", "Craft", "Audience"];

const empty = {
  festival: "",
  award: "",
  year: String(new Date().getFullYear()),
  filmSlug: "",
  category: "Major Prize",
  citation: "",
  id: "",
};

/** URL-friendly key: lowercase, every run of other characters collapses to a single "-". */
const slugKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function AwardsSection() {
  const { refresh: refreshContent, films } = useContent();
  const [items, setItems] = useState<AdminAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<AdminAward[]>("/api/awards");
      // Newly created awards show first (by createdAt, _id, or year descending)
      const sorted = [...data].sort((a, b) => {
        if (b.createdAt && a.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (b._id && a._id) {
          return b._id.localeCompare(a._id);
        }
        return (b.year ?? 0) - (a.year ?? 0);
      });
      setItems(sorted);
    } catch (error) {
      reportError(error, "Could not load honors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filmOptions = films.map((film) => ({ value: film.slug, label: film.title }));
  const filmTitle = (slug: string) => films.find((film) => film.slug === slug)?.title ?? slug;

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
  };

  const startEdit = (award: AdminAward) => {
    setEditingId(award._id);
    setForm({
      festival: award.festival,
      award: award.award,
      year: String(award.year),
      filmSlug: award.filmSlug,
      category: award.category,
      citation: award.citation,
      id: award.id,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.filmSlug) {
      toast.error("Choose a film for this honor");
      return;
    }
    setBusy(true);
    try {
      // The API requires a unique id; left blank on create it is derived from festival + film.
      const id = form.id.trim() || `${slugKey(form.festival)}-${slugKey(form.filmSlug)}`;
      const payload = {
        id,
        festival: form.festival.trim(),
        award: form.award.trim(),
        year: Number(form.year),
        filmSlug: form.filmSlug,
        category: form.category,
        citation: form.citation.trim(),
      };
      if (editingId) {
        await api.put(`/api/awards/${editingId}`, payload, { auth: true });
        toast.success("Honor updated");
      } else {
        const created = await api.post<AdminAward>("/api/awards", payload, { auth: true });
        toast.success("Honor created");
        // Ensure the newly created award is displayed first at the top
        if (created) {
          setItems((prev) => [created, ...prev.filter((item) => item._id !== created._id)]);
        }
      }
      setEditingId(null);
      setForm(empty);
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (award: AdminAward) => {
    try {
      await api.del(`/api/awards/${award._id}`, { auth: true });
      toast.success("Honor deleted");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <>
      <PageHead
        title="Honors"
        description="Festival wins, selections and craft awards. They feed the Award Winners rail on the home page and the honors page."
        action={
          <Button type="button" className="rounded-none" onClick={startCreate}>
            <Plus /> New honor
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-5 border border-border bg-card p-5"
        >
          <p className="font-display text-xl uppercase">{editingId ? "Edit honor" : "New honor"}</p>

          <Field label="Festival" htmlFor="award-festival">
            <TextInput
              id="award-festival"
              required
              value={form.festival}
              onChange={(event) => setForm({ ...form, festival: event.target.value })}
              placeholder="Sundance Film Festival"
            />
          </Field>

          <Field label="Award title" htmlFor="award-title">
            <TextInput
              id="award-title"
              required
              value={form.award}
              onChange={(event) => setForm({ ...form, award: event.target.value })}
              placeholder="Grand Jury Prize — U.S. Dramatic"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Year" htmlFor="award-year">
              <TextInput
                id="award-year"
                type="number"
                required
                min={1900}
                max={2200}
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
              />
            </Field>

            <Field label="Category" htmlFor="award-category">
              <SelectInput
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
                options={CATEGORIES.map((category) => ({ value: category, label: category }))}
              />
            </Field>
          </div>

          <Field label="Film" htmlFor="award-film">
            <SelectInput
              value={form.filmSlug}
              onValueChange={(value) => setForm({ ...form, filmSlug: value })}
              options={filmOptions}
              placeholder="Choose a film"
            />
          </Field>

          <Field label="Citation" htmlFor="award-citation">
            <TextArea
              id="award-citation"
              value={form.citation}
              onChange={(event) => setForm({ ...form, citation: event.target.value })}
              placeholder="The jury's words, or a short description of why it won."
            />
          </Field>

          <Field
            label="Id"
            htmlFor="award-id"
            hint="URL-friendly key, e.g. sundance-drown. Generated from festival + film when left blank."
          >
            <TextInput
              id="award-id"
              required
              value={form.id}
              onChange={(event) => setForm({ ...form, id: event.target.value })}
              placeholder="sundance-drown"
            />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-none" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {editingId ? "Save changes" : "Create honor"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" className="rounded-none" onClick={startCreate}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading honors…
            </p>
          ) : items.length === 0 ? (
            <EmptyState>No honors yet — add the first festival win on the left.</EmptyState>
          ) : (
            items.map((award) => (
              <div
                key={award._id}
                className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-sm font-bold uppercase tracking-tight">
                      {award.award}
                    </p>
                    <span className="border border-border px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {award.category}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {award.festival} · {award.year} · {filmTitle(award.filmSlug)}
                  </p>
                  {award.citation && (
                    <p className="mt-1 line-clamp-2 font-sans text-xs text-muted-foreground">
                      {award.citation}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => startEdit(award)}
                  >
                    <Pencil /> Edit
                  </Button>
                  <ConfirmButton
                    confirmMessage={`Delete the honor “${award.award}” at ${award.festival}?`}
                    onConfirm={() => remove(award)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
