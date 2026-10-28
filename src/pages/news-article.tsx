import { Link, useParams } from "react-router";
import { useState } from "react";
import { motion } from "framer-motion";

import { useContent, useNewsById } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { Reveal } from "@/components/site";

function NewsNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-5 text-center">
      <p className="font-display text-6xl md:text-8xl">Cut!</p>
      <p className="text-lg text-muted-foreground">The requested dispatch could not be found.</p>
      <Link
        to="/news"
        className="rounded-full bg-neon-ink px-6 py-3 font-sans text-xs font-bold uppercase tracking-tight text-white hover:opacity-90"
      >
        ← Back to Dispatches
      </Link>
    </div>
  );
}

export function NewsArticlePage() {
  const { id } = useParams();
  const { news, films } = useContent();
  const article = useNewsById(id);
  const [copied, setCopied] = useState(false);

  usePageMeta(
    article
      ? { title: `${article.title} — Fragrant Nature`, description: article.excerpt }
      : { title: "Dispatch Not Found — Fragrant Nature" },
  );

  if (!article) return <NewsNotFound />;

  const moreArticles = news.filter((n) => n.id !== article.id).slice(0, 3);
  const connectedFilm = article.filmSlug ? films.find((f) => f.slug === article.filmSlug) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="pt-24 md:pt-32">
      {/* Top Back Navigation */}
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <Link
          to="/news"
          className="group inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground transition-colors hover:text-neon-ink"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          <span>Back to All Dispatches</span>
        </Link>
      </div>

      <article className="mx-auto max-w-[1200px] px-5 py-8 md:px-10 md:py-12">
        {/* Header Metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-neon-ink px-3 py-1 font-sans text-xs font-bold uppercase tracking-tight text-white shadow-sm">
            {article.tag}
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
            {article.date} · {article.readTime}
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
            • By {article.author}
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="mt-6 font-display text-4xl uppercase leading-[0.88] sm:text-6xl md:text-7xl lg:text-8xl">
          {article.title}
        </h1>

        {/* Lead Excerpt */}
        <p className="mt-8 text-xl leading-relaxed text-muted-foreground sm:text-2xl md:max-w-4xl">
          {article.excerpt}
        </p>

        {/* Widescreen Feature Media */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-12 aspect-[16/9] w-full overflow-hidden rounded-3xl border border-border bg-black shadow-2xl sm:aspect-[21/9]"
        >
          <img
            src={article.image}
            alt={article.title}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </motion.div>

        {/* Article Body Content */}
        <div className="mx-auto mt-14 max-w-3xl">
          {/* Pull quote */}
          {article.quote && (
            <blockquote className="mb-12 rounded-3xl border-l-4 border-neon-ink bg-neon-ink/10 p-6 md:p-8">
              <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl italic">
                "{article.quote.text}"
              </p>
              <footer className="mt-4 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink not-italic">
                — {article.quote.author}
              </footer>
            </blockquote>
          )}

          {/* Paragraphs */}
          <div className="space-y-6 text-lg leading-relaxed text-foreground/85 sm:text-xl">
            {article.content.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Connected Movie Release Banner */}
          {connectedFilm && (
            <div className="mt-16 flex flex-col gap-6 rounded-3xl border border-border bg-card/60 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
              <div className="flex items-center gap-5">
                <img
                  src={connectedFilm.poster}
                  alt={connectedFilm.title}
                  className="h-24 w-16 rounded-xl object-cover shadow-lg"
                />
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                    Associated Film
                  </p>
                  <p className="mt-1 font-display text-3xl uppercase leading-none">
                    {connectedFilm.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dir. {connectedFilm.director} · {connectedFilm.year} · {connectedFilm.genre}
                  </p>
                </div>
              </div>
              <Link
                to={`/films/${connectedFilm.slug}`}
                className="inline-flex items-center justify-center rounded-full bg-neon-ink px-6 py-3 font-sans text-xs font-bold uppercase tracking-tight text-white transition-opacity hover:opacity-90"
              >
                Explore Movie →
              </Link>
            </div>
          )}

          {/* Share & Actions Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-border py-6">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-tight text-foreground transition-colors hover:border-neon-ink hover:text-neon-ink"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>{copied ? "Link Copied!" : "Share Dispatch"}</span>
            </button>

            <Link
              to="/news"
              className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground hover:text-foreground"
            >
              ← Return to News Index
            </Link>
          </div>
        </div>
      </article>

      {/* More Dispatches Section */}
      <section className="mx-auto max-w-[1200px] border-t border-border px-5 py-20 md:px-10">
        <h2 className="font-display text-4xl uppercase md:text-5xl">
          More <span className="text-outline">Dispatches</span>
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {moreArticles.map((n, i) => (
            <Reveal key={n.id} delay={i * 0.1}>
              <Link to={`/news/${n.id}`} className="group block h-full">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-black">
                  <img
                    src={n.image}
                    alt={n.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                  {n.tag} — {n.date}
                </p>
                <h3 className="mt-2 text-xl font-bold uppercase tracking-tight group-hover:text-neon-ink transition-colors md:text-2xl">
                  {n.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
