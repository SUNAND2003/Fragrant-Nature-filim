import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Eye,
  EyeOff,
  Film as FilmIcon,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { Film, GalleryImage, GalleryItem } from "@/lib/films";
import { Button } from "@/components/ui/button";
import {
  ConfirmButton,
  EmptyState,
  Field,
  PageHead,
  SelectInput,
  TextInput,
  reportError,
} from "@/pages/admin/ui";

type ImageFormState = {
  url: string;
  caption: string;
};

const emptyImage: ImageFormState = { url: "", caption: "" };

const emptyForm = {
  filmTitle: "",
  filmSlug: "",
  genre: "",
  year: new Date().getFullYear(),
  poster: "",
  images: [] as GalleryImage[],
};

export function GallerySection() {
  const { films, refresh: refreshContent } = useContent();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  // New image input inside the left form
  const [newImage, setNewImage] = useState<ImageFormState>(emptyImage);

  // Upload refs and state for multiple photos & single photo
  const multiFileRef = useRef<HTMLInputElement>(null);
  const [multiUploading, setMultiUploading] = useState(false);
  const [multiProgress, setMultiProgress] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const singleFileRef = useRef<HTMLInputElement>(null);
  const [singleUploading, setSingleUploading] = useState(false);

  const posterFileRef = useRef<HTMLInputElement>(null);
  const [posterUploading, setPosterUploading] = useState(false);

  // Quick inline add image on right item cards
  const quickFileRef = useRef<HTMLInputElement>(null);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickAddId, setQuickAddId] = useState<string | null>(null);
  const [quickImageUrl, setQuickImageUrl] = useState("");
  const [quickImageCaption, setQuickImageCaption] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.get<GalleryItem[]>("/api/gallery?all=true", { auth: true });
      setItems([...list].sort((a, b) => a.order - b.order));
    } catch (error) {
      reportError(error, "Could not load the gallery sets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewImage(emptyImage);
  };

  const startEdit = (item: GalleryItem) => {
    setEditingId(item._id);
    setForm({
      filmTitle: item.filmTitle,
      filmSlug: item.filmSlug,
      genre: item.genre ?? "",
      year: item.year ?? new Date().getFullYear(),
      poster: item.poster ?? "",
      images: item.images ?? [],
    });
    setNewImage(emptyImage);
  };

  // Helper when selecting an existing film from dropdown to auto-fill metadata
  const handleSelectFilm = (filmSlug: string) => {
    const matched = films.find((f) => f.slug === filmSlug);
    if (!matched) return;
    setForm((prev) => ({
      ...prev,
      filmTitle: matched.title,
      filmSlug: matched.slug,
      genre: matched.genre,
      year: matched.year,
      poster: matched.poster,
    }));
    toast.info(`Populated metadata from film "${matched.title}"`);
  };

  const handleAddImage = () => {
    if (!newImage.url.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    const trimmedUrl = newImage.url.trim();
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: trimmedUrl,
          caption: newImage.caption.trim(),
          order: prev.images.length + 1,
        },
      ],
    }));
    setNewImage(emptyImage);
    toast.success("Image added to set. Click 'Save Photo Set' to publish.");
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Quick helper to populate stock still frames from public/gallery/
  const handleAddSampleStills = () => {
    const startIdx = (form.images.length % 35) + 1;
    const samples: GalleryImage[] = Array.from({ length: 4 }, (_, k) => {
      const num = String(((startIdx + k - 1) % 42) + 1).padStart(2, "0");
      return {
        url: `/gallery/g${num}.jpg`,
        caption: `Production still frame ${num}`,
        order: form.images.length + k + 1,
      };
    });
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...samples],
    }));
    toast.success("Added 4 sample still frames from /gallery/");
  };

  // Upload multiple images directly into the current form set
  const handleUploadMultiple = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error("Please select valid image files");
      return;
    }
    setMultiUploading(true);
    let successCount = 0;
    const uploadedImages: GalleryImage[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (!file) continue;
      setMultiProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const media = await api.upload<{ url: string }>("/api/upload", file, { kind: "gallery" });
        const caption = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        uploadedImages.push({
          url: media.url,
          caption,
          order: form.images.length + uploadedImages.length + 1,
        });
        successCount++;
      } catch (err) {
        reportError(err, `Could not upload ${file.name}`);
      }
    }

    if (uploadedImages.length > 0) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedImages],
      }));
      toast.success(`Uploaded ${successCount} photo${successCount > 1 ? "s" : ""} to set!`);
    }
    setMultiUploading(false);
    setMultiProgress(null);
    if (multiFileRef.current) multiFileRef.current.value = "";
  };

  // Upload single photo into newImage
  const handleUploadSingle = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setSingleUploading(true);
    try {
      const media = await api.upload<{ url: string }>("/api/upload", file, { kind: "gallery" });
      const caption =
        newImage.caption.trim() ||
        file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      setNewImage({
        url: media.url,
        caption,
      });
      toast.success("Image uploaded!");
    } catch (err) {
      reportError(err, "Failed to upload image");
    } finally {
      setSingleUploading(false);
      if (singleFileRef.current) singleFileRef.current.value = "";
    }
  };

  // Upload poster
  const handleUploadPoster = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setPosterUploading(true);
    try {
      const media = await api.upload<{ url: string }>("/api/upload", file, { kind: "poster" });
      setForm((prev) => ({ ...prev, poster: media.url }));
      toast.success("Poster image uploaded!");
    } catch (err) {
      reportError(err, "Failed to upload poster");
    } finally {
      setPosterUploading(false);
      if (posterFileRef.current) posterFileRef.current.value = "";
    }
  };

  // Quick card upload
  const handleQuickUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    setQuickUploading(true);
    try {
      const media = await api.upload<{ url: string }>("/api/upload", file, { kind: "gallery" });
      setQuickImageUrl(media.url);
      if (!quickImageCaption.trim()) {
        setQuickImageCaption(
          file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        );
      }
      toast.success("Photo uploaded! Click Save Photo to add to film.");
    } catch (err) {
      reportError(err, "Failed to upload image");
    } finally {
      setQuickUploading(false);
      if (quickFileRef.current) quickFileRef.current.value = "";
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.filmTitle.trim()) {
      toast.error("Please provide a film title");
      return;
    }

    setBusy(true);
    try {
      // If user typed into the new image URL input but didn't click '+ Add Image', include it automatically!
      const finalImages = [...form.images];
      if (newImage.url.trim()) {
        finalImages.push({
          url: newImage.url.trim(),
          caption: newImage.caption.trim(),
          order: finalImages.length + 1,
        });
      }

      const slug =
        form.filmSlug.trim() ||
        form.filmTitle
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-");

      const payload = {
        filmTitle: form.filmTitle.trim(),
        filmSlug: slug,
        genre: form.genre.trim(),
        year: Number(form.year) || new Date().getFullYear(),
        poster: form.poster.trim(),
        images: finalImages,
      };

      if (editingId) {
        await api.put(`/api/gallery/${editingId}`, payload, { auth: true });
        toast.success(`Photo set for "${form.filmTitle}" updated!`);
      } else {
        await api.post("/api/gallery", { ...payload, order: items.length }, { auth: true });
        toast.success(`New photo set for "${form.filmTitle}" created!`);
      }

      setEditingId(null);
      setForm(emptyForm);
      setNewImage(emptyImage);
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Failed to save photo set");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: GalleryItem) => {
    try {
      await api.del(`/api/gallery/${item._id}`, { auth: true });
      toast.success(`Deleted photo set for "${item.filmTitle}"`);
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not delete photo set");
    }
  };

  const toggleVisibility = async (item: GalleryItem) => {
    try {
      await api.put(`/api/gallery/${item._id}`, { visible: !item.visible }, { auth: true });
      toast.success(item.visible ? "Hidden from the public gallery" : "Visible in public gallery");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  const move = async (index: number, delta: -1 | 1) => {
    const next = [...items];
    const swap = index + delta;
    const current = next[index];
    const neighbour = next[swap];
    if (!current || !neighbour) return;
    next[index] = neighbour;
    next[swap] = current;
    setItems(next);
    try {
      await api.put("/api/gallery", { order: next.map((item) => item._id) }, { auth: true });
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
      await load();
    }
  };

  // Quick inline add image directly on an item card on the right
  const handleQuickAddImage = async (item: GalleryItem) => {
    if (!quickImageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }
    setQuickBusy(true);
    try {
      const updatedImages = [
        ...(item.images ?? []),
        {
          url: quickImageUrl.trim(),
          caption: quickImageCaption.trim(),
          order: (item.images?.length ?? 0) + 1,
        },
      ];
      await api.put(`/api/gallery/${item._id}`, { images: updatedImages }, { auth: true });
      toast.success(`Added photo to "${item.filmTitle}" gallery!`);
      setQuickAddId(null);
      setQuickImageUrl("");
      setQuickImageCaption("");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not add image");
    } finally {
      setQuickBusy(false);
    }
  };

  // Quick remove photo directly from an item card thumbnail
  const handleQuickRemoveImage = async (item: GalleryItem, imgIndex: number) => {
    const updated = (item.images ?? []).filter((_, i) => i !== imgIndex);
    try {
      await api.put(`/api/gallery/${item._id}`, { images: updated }, { auth: true });
      toast.success("Photo removed from set");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error, "Could not remove photo");
    }
  };

  return (
    <>
      <PageHead
        title="Gallery"
        description="Manage cinema photo sets and behind-the-scenes photography. Upload or link still frames per film to showcase in the public Gallery."
        action={
          <div className="flex items-center gap-2.5">
            <Button
              asChild
              variant="outline"
              className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100 font-semibold"
            >
              <Link to="/gallery" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> Visit Gallery
              </Link>
            </Button>
            <Button
              type="button"
              className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm font-semibold"
              onClick={startCreate}
            >
              <Plus className="h-4 w-4" /> New photo set
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,27rem)_1fr]">
        {/* Left Form: Create / Edit Photo Set */}
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-6 border border-border bg-card p-5"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <p className="font-display text-xl uppercase text-foreground">
              {editingId ? "Edit Photo Set" : "New Photo Set"}
            </p>
            {editingId && (
              <span className="rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                Editing
              </span>
            )}
          </div>

          {/* Quick Slate Film Picker */}
          {films.length > 0 && !editingId && (
            <Field
              label="Choose from Film Slate"
              hint="Quickly auto-fill details from an existing film."
            >
              <SelectInput
                value=""
                onValueChange={handleSelectFilm}
                placeholder="-- Select a film to auto-fill --"
                options={films.map((f: Film) => ({
                  value: f.slug,
                  label: `${f.title} (${f.year}) · ${f.genre}`,
                }))}
              />
            </Field>
          )}

          <Field label="Film Title" htmlFor="gallery-film-title">
            <TextInput
              id="gallery-film-title"
              required
              value={form.filmTitle}
              onChange={(e) =>
                setForm({
                  ...form,
                  filmTitle: e.target.value,
                  filmSlug:
                    form.filmSlug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                })
              }
              placeholder="e.g. Red Highway"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Film Slug" htmlFor="gallery-film-slug" hint="URL identifier">
              <TextInput
                id="gallery-film-slug"
                required
                value={form.filmSlug}
                onChange={(e) => setForm({ ...form, filmSlug: e.target.value })}
                placeholder="e.g. red-highway"
              />
            </Field>

            <Field label="Release Year" htmlFor="gallery-film-year">
              <TextInput
                id="gallery-film-year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                placeholder="2026"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Genre / Tag" htmlFor="gallery-film-genre">
              <TextInput
                id="gallery-film-genre"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                placeholder="e.g. Neo-Western"
              />
            </Field>

            <Field
              label="Key Art / Poster URL"
              htmlFor="gallery-film-poster"
              hint="Optional cover image"
            >
              <div className="flex gap-2">
                <TextInput
                  id="gallery-film-poster"
                  value={form.poster}
                  onChange={(e) => setForm({ ...form, poster: e.target.value })}
                  placeholder="/images/films/hero.jpg"
                  className="flex-1"
                />
                <input
                  ref={posterFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadPoster(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={posterUploading}
                  onClick={() => posterFileRef.current?.click()}
                  className="rounded-none border-neutral-300 text-xs px-3 h-10 shrink-0 cursor-pointer hover:bg-neutral-100"
                  title="Upload poster image from computer"
                >
                  {posterUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Upload
                </Button>
              </div>
            </Field>
          </div>

          {/* Photo Set Images Section */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void handleUploadMultiple(e.dataTransfer.files);
            }}
            className={`space-y-3 rounded-none border p-4 transition-colors ${
              isDragging
                ? "border-neutral-900 bg-neutral-100/90 ring-2 ring-neutral-900/10"
                : "border-neutral-300 bg-background/80"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-neutral-900" />
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-neutral-900">
                  Still Photos in Set ({form.images.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={multiFileRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadMultiple(e.target.files)}
                />
                <button
                  type="button"
                  disabled={multiUploading}
                  onClick={() => multiFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-none border border-neutral-900 bg-neutral-900 px-2.5 py-1 font-mono text-[10px] font-bold text-white hover:bg-neutral-800 disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Upload image files directly to this photo set"
                >
                  {multiUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {multiProgress || "Uploading…"}
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" />
                      Upload Photos
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleAddSampleStills}
                  className="inline-flex items-center gap-1 rounded-none border border-neutral-300 bg-neutral-100 px-2 py-1 font-mono text-[10px] font-bold text-neutral-800 hover:bg-neutral-200 cursor-pointer"
                  title="Add 4 sample gallery stills"
                >
                  + 4 Samples
                </button>
              </div>
            </div>

            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              Photos appear in the public 16:10 cinema grid and open in the full-screen lightbox.
              Drag & drop image files anywhere in this box or click{" "}
              <strong className="text-neutral-900 font-semibold">Upload Photos</strong>.
            </p>

            {isDragging && (
              <div className="flex items-center justify-center rounded border-2 border-dashed border-neutral-900 bg-neutral-100 py-3 text-center">
                <p className="font-sans text-xs font-bold text-neutral-900">
                  Drop image files here to upload instantly to this set
                </p>
              </div>
            )}

            {/* Thumbnail Grid of Current Images */}
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                {form.images.map((img, index) => (
                  <div
                    key={index}
                    className="group relative aspect-[16/10] overflow-hidden rounded-md border border-neutral-300 bg-neutral-950 shadow-2xs"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `Photo ${index + 1}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="rounded bg-red-600 p-1 text-white hover:bg-red-700 shadow-sm"
                        title="Remove photo"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => multiFileRef.current?.click()}
                className="cursor-pointer border border-dashed border-neutral-300 p-4 text-center font-sans text-xs text-neutral-600 hover:border-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                <Upload className="mx-auto h-5 w-5 text-neutral-400 mb-1" />
                <p className="font-medium text-neutral-800">No photos in this set yet</p>
                <p className="text-[11px] text-neutral-500">
                  Click to upload from device, or paste a URL below
                </p>
              </div>
            )}

            {/* Input to Add New Image */}
            <div className="space-y-2.5 border-t border-neutral-300 pt-3">
              <div className="flex items-center justify-between">
                <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                  Add Single Photo Frame
                </p>
                <input
                  ref={singleFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadSingle(e.target.files?.[0])}
                />
                <button
                  type="button"
                  disabled={singleUploading}
                  onClick={() => singleFileRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                >
                  {singleUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3" /> Browse file from computer
                    </>
                  )}
                </button>
              </div>

              {/* Preview if newImage.url is populated */}
              {newImage.url && (
                <div className="flex items-center gap-3 rounded border border-neutral-300 bg-neutral-100 p-2">
                  <div className="relative aspect-[16/10] h-12 overflow-hidden rounded bg-black shrink-0">
                    <img src={newImage.url} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[11px] text-neutral-800">
                      {newImage.url}
                    </p>
                    <p className="font-sans text-[10px] text-muted-foreground">
                      Ready to add to set
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewImage(emptyImage)}
                    className="text-neutral-500 hover:text-black p-1 cursor-pointer"
                    title="Clear"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <div className="flex gap-2">
                  <TextInput
                    placeholder="Image URL or browse file (e.g. /gallery/g01.jpg)"
                    value={newImage.url}
                    onChange={(e) => setNewImage({ ...newImage, url: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddImage();
                      }
                    }}
                    className="h-9 text-xs border-neutral-300 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={singleUploading}
                    onClick={() => singleFileRef.current?.click()}
                    className="rounded-none border-neutral-300 text-xs px-2.5 h-9 shrink-0 cursor-pointer hover:bg-neutral-100"
                    title="Upload image from computer"
                  >
                    {singleUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload
                  </Button>
                </div>
                <TextInput
                  placeholder="Caption / Shot note (e.g. Midnight corridor scene)"
                  value={newImage.caption}
                  onChange={(e) => setNewImage({ ...newImage, caption: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  className="h-9 text-xs border-neutral-300"
                />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={handleAddImage}
                className="w-full rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold py-2 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> + Add Image to Set
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 rounded-none bg-neutral-900 text-white hover:bg-neutral-800 font-semibold py-2.5 shadow-xs cursor-pointer"
              disabled={busy}
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? "Save Photo Set" : "Create Photo Set"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                className="rounded-none border border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                onClick={startCreate}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Right Column: Existing Gallery Sets List */}
        <div className="space-y-4">
          {loading ? (
            <p className="flex items-center gap-2 font-sans text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading gallery photo sets…
            </p>
          ) : items.length === 0 ? (
            <EmptyState>
              No gallery photo sets created yet. Create one using the form on the left. <br />
              Running <code>npm run seed</code> populates the default 6 film photo sets.
            </EmptyState>
          ) : (
            items.map((item, index) => {
              const photoCount = item.images?.length ?? 0;
              const isQuickAdding = quickAddId === item._id;

              return (
                <div
                  key={item._id}
                  className={`border border-border bg-card p-4 transition-all shadow-2xs ${
                    item.visible ? "" : "opacity-60"
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Move ${item.filmTitle} up`}
                          className="h-6 w-7 rounded-none px-0 hover:bg-neutral-200"
                          disabled={index === 0}
                          onClick={() => void move(index, -1)}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Move ${item.filmTitle} down`}
                          className="h-6 w-7 rounded-none px-0 hover:bg-neutral-200"
                          disabled={index === items.length - 1}
                          onClick={() => void move(index, 1)}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-sans text-base font-bold uppercase tracking-tight text-neutral-900">
                            {item.filmTitle}
                          </p>
                          <span className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 font-mono text-[10px] uppercase font-bold text-white shadow-2xs">
                            <ImageIcon className="h-2.5 w-2.5" /> {photoCount} Photo
                            {photoCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-muted-foreground mt-0.5">
                          {item.genre || "Film"} · {item.year} ·{" "}
                          <span className="font-mono text-[11px]">/films/{item.filmSlug}</span>
                          {!item.visible && " · hidden from public gallery"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                        aria-label={`${item.visible ? "Hide" : "Show"} ${item.filmTitle}`}
                        onClick={() => void toggleVisibility(item)}
                      >
                        {item.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}{" "}
                        {item.visible ? "Hide" : "Show"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                        onClick={() => startEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-semibold"
                        onClick={() => {
                          setQuickAddId(isQuickAdding ? null : item._id);
                          setQuickImageUrl("");
                          setQuickImageCaption("");
                        }}
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Image
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                      >
                        <Link
                          to={`/films/${item.filmSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FilmIcon className="h-3.5 w-3.5" /> Film
                        </Link>
                      </Button>
                      <ConfirmButton
                        confirmMessage={`Remove photo set for “${item.filmTitle}”?`}
                        onConfirm={() => remove(item)}
                      />
                    </div>
                  </div>

                  {/* Inline Quick Add Image Box */}
                  {isQuickAdding && (
                    <div className="mt-3 rounded border border-neutral-300 bg-neutral-50 p-3 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-neutral-900">
                          Quick Add Photo to {item.filmTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuickAddId(null)}
                          className="text-xs text-neutral-500 hover:text-black font-semibold cursor-pointer"
                        >
                          ✕ Close
                        </button>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2">
                        <TextInput
                          placeholder="Image URL or upload"
                          value={quickImageUrl}
                          onChange={(e) => setQuickImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleQuickAddImage(item);
                            }
                          }}
                          className="h-8 text-xs bg-white border-neutral-300"
                        />
                        <input
                          ref={quickFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void handleQuickUpload(e.target.files?.[0])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={quickUploading}
                          onClick={() => quickFileRef.current?.click()}
                          className="rounded-none border-neutral-300 text-xs h-8 px-2.5 cursor-pointer bg-white hover:bg-neutral-100"
                          title="Upload image file from computer"
                        >
                          {quickUploading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </Button>
                        <TextInput
                          placeholder="Caption (optional)"
                          value={quickImageCaption}
                          onChange={(e) => setQuickImageCaption(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleQuickAddImage(item);
                            }
                          }}
                          className="h-8 text-xs bg-white border-neutral-300"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={quickBusy}
                          onClick={() => void handleQuickAddImage(item)}
                          className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800 text-xs h-8 px-3 font-semibold cursor-pointer"
                        >
                          {quickBusy ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Save Photo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Gallery Photo Tiles Preview (16:10 aspect ratio matching the public gallery) */}
                  {photoCount > 0 ? (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {item.images?.map((img, imgIdx) => (
                        <div
                          key={imgIdx}
                          className="group relative aspect-[16/10] overflow-hidden rounded-md border border-neutral-300 bg-neutral-900 shadow-2xs"
                        >
                          <img
                            src={img.url}
                            alt={img.caption || `Photo ${imgIdx + 1}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => void handleQuickRemoveImage(item, imgIdx)}
                              className="rounded bg-red-600 p-1 text-white hover:bg-red-700 shadow-sm"
                              title="Delete photo"
                              aria-label={`Delete photo ${imgIdx + 1}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="absolute left-1 top-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[8px] font-bold text-white">
                            {String(imgIdx + 1).padStart(2, "0")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground italic">
                      No photos in this set yet. Click &quot;Add Image&quot; above to add still
                      frames.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
