import { Link } from "react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ExternalLink, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { NewsArticle } from "@/lib/films";
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

/** The API adds `_id` (used by PUT/DELETE), `published` and timestamps. */
type AdminArticle = NewsArticle & {
  _id: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const empty = {
  title: "",
  date: "",
  tag: "",
  author: "",
  readTime: "",
  excerpt: "",
  image: "",
  filmSlug: "",
  content: "",
  quoteText: "",
  quoteAuthor: "",
  published: true,
};

export function NewsSection() {
  const { refresh: refreshContent, films } = useContent();
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const articles = await api.get<AdminArticle[]>("/api/news?all=true", { auth: true });
      // Newest first regardless of server ordering; equal stamps keep the server order.
      setItems([...articles].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")));
    } catch (error) {
      reportError(error, "Could not load news");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filmOptions = films.map((film) => ({ value: film.slug, label: film.title }));

  const startCreate = () => {
    setEditingId(null);
    setForm(empty);
  };

  const startEdit = (article: AdminArticle) => {
    setEditingId(article._id);
    setForm({
      title: article.title,
      date: article.date,
      tag: article.tag,
      author: article.author,
      readTime: article.readTime,
      excerpt: article.excerpt,
      image: article.image,
      filmSlug: article.filmSlug ?? "",
      // One paragraph per line in the editor.
      content: article.content.join("\n"),
      quoteText: article.quote?.text ?? "",
      quoteAuthor: article.quote?.author ?? "",
      published: article.published ?? true,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      // `id` is assigned by the server on create and is never sent back on update.
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        tag: form.tag.trim(),
        author: form.author.trim(),
        readTime: form.readTime.trim(),
        excerpt: form.excerpt.trim(),
        image: form.image.trim(),
        content: form.content
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        published: form.published,
      };
      // A blank date means "today" on the server, so the key is left out.
      if (form.date.trim()) payload["date"] = form.date.trim();
      // No linked film → key omitted entirely (blank is not a valid link).
      if (form.filmSlug) payload["filmSlug"] = form.filmSlug;
      const quoteText = form.quoteText.trim();
      if (quoteText) {
        payload["quote"] = { text: quoteText, author: form.quoteAuthor.trim() };
      } else if (editingId) {
        // Sending null clears a quote that was removed; omitting would keep it.
        payload["quote"] = null;
      }

      if (editingId) {
        await api.put(`/api/news/${editingId}`, payload, { auth: true });
        toast.success("Article updated");
      } else {
        await api.post("/api/news", payload, { auth: true });
        toast.success("Article created");
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

  const remove = async (article: AdminArticle) => {
    try {
      await api.del(`/api/news/${article._id}`, { auth: true });
      toast.success("Article deleted");
      await load();
      await refreshContent();
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <>
      <PageHead
        title="News"
        description="Studio announcements, festival dispatches and trailer drops. Drafts stay hidden from the public site until published."
        action={
          <Button type="button" className="rounded-none" onClick={startCreate}>
            <Plus /> New article
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,24rem)_1fr]">
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-5 border border-border bg-card p-5"
        >
          <p className="font-display text-xl uppercase">
            {editingId ? "Edit article" : "New article"}
          </p>

          <Field label="Title" htmlFor="news-title">
            <TextInput
              id="news-title"
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Drown takes the Grand Jury Prize"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="news-date" hint="Leave blank for today.">
              <TextInput
                id="news-date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
                placeholder="Oct 18, 2026"
              />
            </Field>

            <Field label="Tag" htmlFor="news-tag">
              <TextInput
                id="news-tag"
                value={form.tag}
                onChange={(event) => setForm({ ...form, tag: event.target.value })}
                placeholder="Awards"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Author" htmlFor="news-author">
              <TextInput
                id="news-author"
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
                placeholder="Claire Moreau"
              />
            </Field>

            <Field label="Read time" htmlFor="news-readtime">
              <TextInput
                id="news-readtime"
                value={form.readTime}
                onChange={(event) => setForm({ ...form, readTime: event.target.value })}
                placeholder="4 min read"
              />
            </Field>
          </div>

          <Field label="Excerpt" htmlFor="news-excerpt">
            <TextArea
              id="news-excerpt"
              value={form.excerpt}
              onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
              placeholder="One or two lines shown on the news list."
            />
          </Field>

          <ImagePicker
            kind="news"
            label="Article image"
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
          />

          <Field label="Linked film" htmlFor="news-film" hint="Optional — shown as a related link.">
            <SelectInput
              value={form.filmSlug}
              onValueChange={(value) => setForm({ ...form, filmSlug: value })}
              options={filmOptions}
              placeholder="None"
            />
          </Field>

          <Field
            label="Content"
            htmlFor="news-content"
            hint="One paragraph per line — blank lines are dropped."
          >
            <TextArea
              id="news-content"
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder={"First paragraph.\nSecond paragraph."}
            />
          </Field>

          <div className="space-y-4 border border-border bg-background p-4">
            <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Pull quote
            </p>
            <Field label="Quote text" htmlFor="news-quote-text" hint="Saved only when it has text.">
              <TextArea
                id="news-quote-text"
                value={form.quoteText}
                onChange={(event) => setForm({ ...form, quoteText: event.target.value })}
                placeholder="“We wanted to physically submerge the audience.”"
              />
            </Field>
            <Field label="Quote author" htmlFor="news-quote-author">
              <TextInput
                id="news-quote-author"
                value={form.quoteAuthor}
                onChange={(event) => setForm({ ...form, quoteAuthor: event.target.value })}
                placeholder="Ines Haverkamp, Director"
              />
            </Field>
          </div>

          <SwitchInput
            label={form.published ? "Published" : "Draft"}
            checked={form.published}
            onCheckedChange={(checked) => setForm({ ...form, published: checked })}
          />

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-none" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              {editingId ? "Save changes" : "Create article"}
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
              <Loader2 className="h-4 w-4 animate-spin" /> Loading articles…
            </p>
          ) : items.length === 0 ? (
            <EmptyState>No articles yet — write the first one on the left.</EmptyState>
          ) : (
            items.map((article) => (
              <div
                key={article._id}
                className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-sm font-bold uppercase tracking-tight">
                      {article.title}
                    </p>
                    {!article.published && (
                      <span className="border border-destructive/50 bg-destructive/10 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-widest text-destructive">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {article.date || "No date"} · {article.tag || "Untagged"} ·{" "}
                    {article.author || "No author"} ·{" "}
                    <Link
                      to={`/news/${article.id}`}
                      className="inline-flex items-center gap-1 text-neon-ink underline hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-none"
                    onClick={() => startEdit(article)}
                  >
                    <Pencil /> Edit
                  </Button>
                  <ConfirmButton
                    confirmMessage={`Delete the article “${article.title}”? This cannot be undone.`}
                    onConfirm={() => remove(article)}
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
