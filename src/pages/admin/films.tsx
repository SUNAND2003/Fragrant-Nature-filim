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
  VideoPicker,
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
  screenRequest: boolean;
  poster: string;
  banner: string;
  still: string;
  comingSoonBanner: string;
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
  screenRequest: true,
  poster: "",
  banner: "",
  still: "",
  comingSoonBanner: "",
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
      const data = await api.get<Film[]>("/api/films");
      // Newly added films show first (by createdAt, _id, or year descending)
      const sorted = [...data].sort((a, b) => {
        const aDoc = a as Film & { createdAt?: string; _id?: string };
        const bDoc = b as Film & { createdAt?: string; _id?: string };
        if (bDoc.createdAt && aDoc.createdAt) {
          return new Date(bDoc.createdAt).getTime() - new Date(aDoc.createdAt).getTime();
        }
        if (bDoc._id && aDoc._id) {
          return bDoc._id.localeCompare(aDoc._id);
        }
        return (b.year ?? 0) - (a.year ?? 0);
      });
      setItems(sorted);
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
      screenRequest: film.screenRequest ?? true,
      poster: film.poster,
      banner: film.banner ?? "",
      still: film.still ?? "",
      comingSoonBanner: film.comingSoonBanner ?? "",
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
        screenRequest: form.screenRequest,
        order: Number(form.order) || 0,
        poster: form.poster.trim(),
        banner: form.banner.trim(),
        still: form.still.trim(),
        comingSoonBanner: form.comingSoonBanner.trim(),
      };
      if (editingId) {
        await api.put(`/api/films/${editingId}`, payload, { auth: true });
        toast.success("Film updated");
      } else {
        const created = await api.post<Film>("/api/films", payload, { auth: true });
        toast.success("Film created");
        // Ensure the newly created film immediately shows first
        if (created) {
          setItems((prev) => [created, ...prev.filter((item) => item.slug !== created.slug)]);
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

          <Field
            label="Trailer (URL or Upload MP4)"
            htmlFor="film-trailer"
            hint="Paste a YouTube / Vimeo / direct MP4 URL, or click Upload MP4 to upload a local video file."
          >
            <VideoPicker
              id="film-trailer"
              label="Trailer"
              value={form.trailer}
              onChange={(trailer) => setForm({ ...form, trailer })}
            />
          </Field>

          <div className="space-y-4 border border-border/80 bg-background/40 p-4">
            <div className="border-b border-border pb-2.5">
              <p className="font-display text-sm uppercase tracking-wider text-foreground">
                Artwork by Display Area
              </p>
              <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                Upload area-specific artwork to avoid cropping issues. Banner &amp; still slots fall back to the poster if left empty.
              </p>
            </div>

            <Field
              label="1. Theatrical Poster (Portrait Card & Catalog)"
              hint="Used in: Films catalog (/films), Now Showing grid, Award Winners, and Movie Cards."
            >
              <ImagePicker
                value={form.poster}
                onChange={(poster) => setForm({ ...form, poster })}
                kind="poster"
                label="Theatrical Poster"
                recommendedSize="1000 × 1500 px (2:3 portrait)"
              />
            </Field>

            <div className="border-t border-border/60 pt-4">
              <Field
                label="2. Hero Banner / Backdrop (Full-screen Carousel)"
                hint="Used in: Home Page Hero Carousel & Film Page top backdrop. Wide landscape prevents vertical cropping."
              >
                <ImagePicker
                  value={form.banner}
                  onChange={(banner) => setForm({ ...form, banner })}
                  kind="banner"
                  label="Hero Banner"
                  recommendedSize="1920 × 1080 px (16:9) or 2048 × 930 px (21:9)"
                />
              </Field>
            </div>

            <div className="border-t border-border/60 pt-4">
              <Field
                label="3. Video Still / Rail Thumbnail (Watch Now)"
                hint="Used in: Home Page 'Watch Now' horizontal preview rail and trailer previews."
              >
                <ImagePicker
                  value={form.still}
                  onChange={(still) => setForm({ ...form, still })}
                  kind="still"
                  label="Video Still"
                  recommendedSize="1280 × 720 px (16:9 widescreen)"
                />
              </Field>
            </div>
            <div className="border-t border-border/60 pt-4">
              <Field
                label="4. Coming Soon Section Poster (2:3 Normal Poster)"
                hint="Used ONLY in: Home Page dark 'Coming soon' showcase stage (when Status is Upcoming). Leave empty to fall back to the film's poster."
              >
                <ImagePicker
                  value={form.comingSoonBanner}
                  onChange={(comingSoonBanner) => setForm({ ...form, comingSoonBanner })}
                  kind="coming-soon"
                  label="Coming Soon Poster"
                  recommendedSize="1000 × 1500 px (2:3 poster)"
                />
              </Field>
            </div>
          </div>

          <div className="grid gap-3">
            <SwitchInput
              label="Featured in carousel"
              checked={form.featured}
              onCheckedChange={(featured) => setForm({ ...form, featured })}
            />

            <SwitchInput
              label="Enable Screen Request Button"
              checked={form.screenRequest}
              onCheckedChange={(screenRequest) => setForm({ ...form, screenRequest })}
            />
          </div>

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
                    <div className="h-20 w-14 shrink-0 overflow-hidden border border-border bg-neutral-950 flex items-center justify-center">
                      {film.poster ? (
                        <img
                          src={film.poster}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover object-center"
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
                        {film.screenRequest !== false ? (
                          <span className="border border-emerald-500/40 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            Screen Request ON
                          </span>
                        ) : (
                          <span className="border border-border px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Screen Request OFF
                          </span>
                        )}
                        {film.banner && (
                          <span className="border border-sky-500/40 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-sky-400">
                            Banner
                          </span>
                        )}
                        {film.still && (
                          <span className="border border-purple-500/40 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-purple-400">
                            Still
                          </span>
                        )}
                        {film.comingSoonBanner && (
                          <span className="border border-cyan-500/40 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                            Coming Soon
                          </span>
                        )}
                        {film.trailer && (
                          <span className="border border-amber-500/40 px-1.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            Trailer
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
