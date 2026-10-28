import { Link } from "react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import type { Film } from "@/lib/films";
import { useContent } from "@/lib/content";
import { Button } from "@/components/ui/button";
import {
  ConfirmButton,
  EmptyState,
  Field,
  ImagePicker,
  PageHead,
  SelectInput,
  SwitchInput,
  TextArea,
  TextInput,
  reportError,
} from "@/pages/admin/ui";

type FilmForm = {
  title: string;
  slug: string;
  director: string;
  year: number;
  genre: string;
  runtime: string;
  rating: string;
  category: string;
  subcategories: string[];
  tagline: string;
  synopsis: string;
  /** Comma-separated in the form, an array on the wire. */
  cast: string;
  status: "now" | "upcoming";
  release: string;
  /** One laurel per line in the form, an array on the wire. */
  laurels: string;
  accent: string;
  trailer: string;
  order: number;
  featured: boolean;
  poster: string;
};

const empty: FilmForm = {
  title: "",
  slug: "",
  director: "",
  year: new Date().getFullYear(),
  genre: "",
  runtime: "",
  rating: "",
  category: "",
  subcategories: [],
  tagline: "",
  synopsis: "",
  cast: "",
  status: "now",
  release: "",
  laurels: "",
  accent: "#7CFF3D",
  trailer: "",
  order: 0,
  featured: false,
  poster: "",
};

const statusOptions = [
  { value: "now", label: "In theaters / now showing" },
  { value: "upcoming", label: "Upcoming" },
];

const toList = (value: string, separator: "," | "\n") =>
  value
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

export function FilmsSection() {
  const { refresh: refreshContent, categories, subcategories } = useContent();
  const [items, setItems] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FilmForm>(empty);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.get<Film[]>("/api/films"));
    } catch (error) {
      reportError(error, "Could not load films");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryOptions = categories.map((category) => ({
    value: category._id,
    label: category.name,
  }));

  const visibleSubcategories = form.category
    ? subcategories.filter((subcategory) => subcategory.category?._id === form.category)
    : subcategories;

  const toggleSubcategory = (id: string) =>
    setForm((previous) => ({
      ...previous,
      subcategories: previous.subcategories.includes(id)
        ? previous.subcategories.filter((existing) => existing !== id)
        : [...previous.subcategories, id],
    }));

  const changeCategory = (categoryId: string) =>
    setForm((previous) => ({
      ...previous,
      category: categoryId,
      // The list below is filtered by category, so drop selections it no longer
      // shows — ids we don't know (content not loaded yet) are kept as-is.
      subcategories: categoryId
        ? previous.subcategories.filter((id) => {
            const subcategory = subcategories.find((candidate) => candidate._id === id);
            return !subcategory || subcategory.category?._id === categoryId;
          })
        : previous.subcategories,
    }));

  const changeStatus = (value: string) =>
    setForm((previous) => ({ ...previous, status: value === "upcoming" ? "upcoming" : "now" }));

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
  };

  const startEdit = (film: Film) => {
    if (!film._id) return;
    setEditingId(film._id);
    setForm({
      title: film.title,
      slug: film.slug,
      director: film.director,
      year: film.year,
      genre: film.genre,
      runtime: film.runtime,
      rating: film.rating,
      category: film.category?._id ?? "",
      subcategories: (film.subcategories ?? []).map((subcategory) => subcategory._id),
      tagline: film.tagline,
      synopsis: film.synopsis,
      cast: film.cast.join(", "),
      status: film.status,
      release: film.release,
      laurels: film.laurels.join("\n"),
      accent: film.accent || empty.accent,
      trailer: film.trailer ?? "",
      order: film.order ?? 0,
      featured: film.featured ?? false,
      poster: film.poster,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const slug = form.slug.trim();
      const payload = {
        title: form.title.trim(),
        // Blank slug → let the server derive one from the title (create) or
        // keep the stored one (update, which is a partial write).
        ...(slug ? { slug } : {}),
        director: form.director.trim(),
        year: Number(form.year) || 0,
        genre: form.genre.trim(),
        runtime: form.runtime.trim(),
        rating: form.rating.trim(),
        category: form.category || null,
        subcategories: form.subcategories,
        tagline: form.tagline.trim(),
        synopsis: form.synopsis.trim(),
        cast: toList(form.cast, ","),
        status: form.status,
        release: form.release.trim(),
        laurels: toList(form.laurels, "\n"),
        accent: form.accent.trim(),
        trailer: form.trailer.trim(),
        featured: form.featured,
        order: Number(form.order) || 0,
        poster: form.poster.trim(),
      };
      if (editingId) {
        await api.put(`/api/films/${editingId}`, payload, { auth: true });
        toast.success("Film updated");
      } else {
        await api.post("/api/films", payload, { auth: true });
        toast.success("Film created");
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

  const remove = async (film: Film) => {
    if (!film._id) return;
    try {
      await api.del(`/api/films/${film._id}`, { auth: true });
      toast.success(`“${film.title}” deleted`);
      if (editingId === film._id) startCreate();
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not delete the film");
    }
  };

  const subcategoryNames = (film: Film) =>
    (film.subcategories ?? []).map((subcategory) => subcategory.name).join(", ");

  return (
    <>
      <PageHead
        title="Films"
        description="The catalogue: artwork, billing, festival laurels and where each title sits in the slate."
        action={
          <Button type="button" className="rounded-none" onClick={startCreate}>
            <Plus /> New film
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-5 border border-border bg-card p-5"
        >
          <p className="font-display text-xl uppercase">{editingId ? "Edit film" : "New film"}</p>

          <Field label="Title" htmlFor="film-title">
            <TextInput
              id="film-title"
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Red Highway"
            />
          </Field>

          <Field label="Slug" htmlFor="film-slug" hint="Leave blank to generate from title.">
            <TextInput
              id="film-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="red-highway"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Director" htmlFor="film-director">
              <TextInput
                id="film-director"
                value={form.director}
                onChange={(event) => setForm({ ...form, director: event.target.value })}
                placeholder="Mara Kessel"
              />
            </Field>

            <Field label="Year" htmlFor="film-year">
              <TextInput
                id="film-year"
                type="number"
                required
                value={form.year}
                onChange={(event) => setForm({ ...form, year: Number(event.target.value) })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre" htmlFor="film-genre">
              <TextInput
                id="film-genre"
                value={form.genre}
                onChange={(event) => setForm({ ...form, genre: event.target.value })}
                placeholder="Neo-Western"
              />
            </Field>

            <Field label="Runtime" htmlFor="film-runtime">
              <TextInput
                id="film-runtime"
                value={form.runtime}
                onChange={(event) => setForm({ ...form, runtime: event.target.value })}
                placeholder="1h 58m"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating" htmlFor="film-rating">
              <TextInput
                id="film-rating"
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: event.target.value })}
                placeholder="R"
              />
            </Field>

            <Field label="Category">
              <SelectInput
                value={form.category}
                onValueChange={changeCategory}
                options={categoryOptions}
                placeholder="No category"
              />
            </Field>
          </div>

          {categories.length === 0 && (
            <p className="border border-border px-3 py-2 font-sans text-xs text-muted-foreground">
              No categories yet — create one first in{" "}
              <Link to="/admin/categories" className="text-neon-ink underline">
                Categories
              </Link>
              .
            </p>
          )}

          <Field label="Subcategories">
            <div className="max-h-44 space-y-1 overflow-y-auto border border-border bg-background p-2">
              {visibleSubcategories.length === 0 ? (
                <p className="px-1 py-1 font-sans text-xs text-muted-foreground">
                  {subcategories.length === 0 ? (
                    <>
                      No subcategories yet — add them in{" "}
                      <Link to="/admin/subcategories" className="text-neon-ink underline">
                        Subcategories
                      </Link>
                      .
                    </>
                  ) : (
                    "None under this category."
                  )}
                </p>
              ) : (
                visibleSubcategories.map((subcategory) => (
                  <label
                    key={subcategory._id}
                    className="flex cursor-pointer items-center gap-2 px-1 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={form.subcategories.includes(subcategory._id)}
                      onChange={() => toggleSubcategory(subcategory._id)}
                      className="h-4 w-4 shrink-0 accent-neon"
                    />
                    <span className="font-sans text-xs">{subcategory.name}</span>
                  </label>
                ))
              )}
            </div>
          </Field>

          <Field label="Tagline" htmlFor="film-tagline">
            <TextInput
              id="film-tagline"
              value={form.tagline}
              onChange={(event) => setForm({ ...form, tagline: event.target.value })}
              placeholder="Some roads only go one way."
            />
          </Field>

          <Field label="Synopsis" htmlFor="film-synopsis">
            <TextArea
              id="film-synopsis"
              value={form.synopsis}
              onChange={(event) => setForm({ ...form, synopsis: event.target.value })}
              placeholder="The logline expanded into a paragraph."
            />
          </Field>

          <Field label="Cast" htmlFor="film-cast" hint="Comma-separated.">
            <TextInput
              id="film-cast"
              value={form.cast}
              onChange={(event) => setForm({ ...form, cast: event.target.value })}
              placeholder="Theo Vance, Lina Ortiz"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <SelectInput
                value={form.status}
                onValueChange={changeStatus}
                options={statusOptions}
              />
            </Field>

            <Field label="Release" htmlFor="film-release">
              <TextInput
                id="film-release"
                value={form.release}
                onChange={(event) => setForm({ ...form, release: event.target.value })}
                placeholder="Feb 14, 2027"
              />
            </Field>
          </div>

          <Field label="Laurels" htmlFor="film-laurels" hint="One per line.">
            <TextArea
              id="film-laurels"
              value={form.laurels}
              onChange={(event) => setForm({ ...form, laurels: event.target.value })}
              placeholder={"Cannes — Official Selection\nBest Cinematography, TIFF"}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Accent" htmlFor="film-accent">
              <div className="flex gap-2">
                <input
                  type="color"
                  aria-label="Film accent color"
                  value={form.accent}
                  onChange={(event) => setForm({ ...form, accent: event.target.value })}
                  className="h-11 w-12 shrink-0 cursor-pointer border border-border bg-background"
                />
                <TextInput
                  id="film-accent"
                  value={form.accent}
                  onChange={(event) => setForm({ ...form, accent: event.target.value })}
                />
              </div>
            </Field>

            <Field label="Sort order" htmlFor="film-order">
              <TextInput
                id="film-order"
                type="number"
                value={form.order}
                onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
              />
            </Field>
          </div>

          <Field label="Trailer" htmlFor="film-trailer">
            <TextInput
              id="film-trailer"
              type="url"
              value={form.trailer}
              onChange={(event) => setForm({ ...form, trailer: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </Field>

          <SwitchInput
            label="Featured"
            checked={form.featured}
            onCheckedChange={(featured) => setForm({ ...form, featured })}
          />

          <Field label="Poster">
            <ImagePicker
              value={form.poster}
              onChange={(poster) => setForm({ ...form, poster })}
              kind="poster"
              label="Poster"
            />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-none" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {editingId ? "Save changes" : "Create film"}
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
              <Loader2 className="h-4 w-4 animate-spin" /> Loading films…
            </p>
          ) : items.length === 0 ? (
            <EmptyState>
              No films yet — create the first one on the left. <br />
              Seed data (<code>npm run seed</code>) loads the demo catalogue.
            </EmptyState>
          ) : (
            items.map((film) => {
              const subNames = subcategoryNames(film);
              return (
                <div
                  key={film._id ?? film.slug}
                  className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-20 w-14 shrink-0 overflow-hidden border border-border bg-muted">
                      {film.poster ? (
                        <img
                          src={film.poster}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-center font-sans text-[9px] uppercase tracking-widest text-muted-foreground">
                          No poster
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-bold uppercase tracking-tight">
                        {film.title}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        /{film.slug} · {film.year}
                      </p>
                      <p className="font-sans text-[11px] break-words text-muted-foreground">
                        {film.category?.name ?? "No category"}
                        {subNames ? ` · ${subNames}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="border border-border px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {film.status === "upcoming" ? "Upcoming" : "Now showing"}
                        </span>
                        {film.featured && (
                          <span className="border border-neon-ink px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-neon-ink">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-none"
                      onClick={() => startEdit(film)}
                    >
                      <Pencil /> Edit
                    </Button>
                    <ConfirmButton
                      confirmMessage={`Delete the film “${film.title}”? This cannot be undone.`}
                      onConfirm={() => remove(film)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
