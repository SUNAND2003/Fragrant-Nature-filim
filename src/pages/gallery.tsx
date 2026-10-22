import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { films } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

type Shot = { src: string; caption: string; meta: string };

// One shot per film, drawn straight from the catalog so the gallery never
// drifts out of sync with the movies it belongs to.
const shots: Shot[] = films.map((f) => ({
  src: f.poster,
  caption: f.title,
  meta: `${f.genre} · ${f.year}`,
}));

const pad = (n: number) => String(n).padStart(2, "0");

export function GalleryPage() {
  usePageMeta({
    title: "Gallery — Fragrant Nature",
    description: "Posters and stills from the Fragrant Nature slate.",
  });

  const [open, setOpen] = useState<number | null>(null);

  // Lightbox controls: Escape closes, arrow keys step through the set.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % shots.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const shot = open === null ? null : shots[open];

  return (
    <>
      <PageTitle eyebrow={`${shots.length} stills`} title="The" outline="Gallery" />
      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        {/* Masonry columns keep each poster at its natural height. */}
        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
          {shots.map((s, i) => (
            <Reveal
              key={s.src + s.caption}
              delay={(i % 3) * 0.08}
              className="mb-5 break-inside-avoid"
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Open ${s.caption}`}
                className="group relative block w-full overflow-hidden rounded-2xl bg-card text-left"
              >
                <img
                  src={s.src}
                  alt={s.caption}
                  loading="lazy"
                  decoding="async"
                  className="w-full transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 scrim-b opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-x-4 bottom-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/70">
                    {s.meta}
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-white md:text-3xl">{s.caption}</h2>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {shot && open !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${shot.caption} — gallery viewer`}
            onClick={() => setOpen(null)}
            className="theme-dark fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-black/95 p-5 md:p-10"
          >
            <button
              type="button"
              aria-label="Close gallery"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(null);
              }}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((i) => (i === null ? i : (i - 1 + shots.length) % shots.length));
              }}
              className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground md:left-6"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((i) => (i === null ? i : (i + 1) % shots.length));
              }}
              className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground md:right-6"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <motion.img
              key={shot.src}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              src={shot.src}
              alt={shot.caption}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[72vh] max-w-full rounded-xl object-contain"
            />

            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-2xl md:text-3xl">{shot.caption}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.25em] text-neon-ink">
                {shot.meta} — {pad(open + 1)} / {pad(shots.length)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
