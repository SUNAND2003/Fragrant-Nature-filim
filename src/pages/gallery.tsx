import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";

import type { Film } from "@/lib/films";
import { useFilms, useGallery } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

type Frame = { src: string; pos: string; ratio: string; no: string };

type ShotFilm = Pick<Film, "title" | "slug" | "genre" | "year"> & { poster?: string };

type ShotSet = { film: ShotFilm; frames: Frame[] };

// Set photography for the gallery. Tiles use a cinematic 16:10 landscape ratio
// matching modern studio catalogs (like Neon), providing balanced height and generous spacing.
const FRAME_RATIO = "aspect-[16/10]";

// Stand-in set photos live in public/gallery/ (900×1200) and are served from
// public, so they stay out of the JS bundle and are lazy-loaded on scroll.
// Each film gets 8 photos — its own poster plus 7 different set photos, shown
// as two rows of four. Film i uses g(7i+1)…g(7i+7), so nothing repeats on the
// page. Drop your real stills over those files (or adjust the mapping) to
// replace them.
const STOCK_PER_FILM = 7;

const stock = (n: number) =>
  `${import.meta.env.BASE_URL}gallery/g${String(n).padStart(2, "0")}.jpg`;

const buildSets = (films: Film[]): ShotSet[] =>
  films.map((film, fi) => ({
    film,
    frames: [
      { src: film.poster, pos: "object-center", ratio: FRAME_RATIO, no: "01" },
      ...Array.from({ length: STOCK_PER_FILM }, (_, k) => ({
        src: stock(fi * STOCK_PER_FILM + k + 1),
        pos: "object-center",
        ratio: FRAME_RATIO,
        no: String(k + 2).padStart(2, "0"),
      })),
    ],
  }));

export function GalleryPage() {
  usePageMeta({
    title: "Gallery — Fragrant Nature",
    description: "Photo sets from the Fragrant Nature slate, film by film.",
  });

  const films = useFilms();
  const gallery = useGallery();

  const sets = useMemo<ShotSet[]>(() => {
    if (gallery && gallery.length > 0) {
      return gallery.map((item) => {
        const matchedFilm = films.find(
          (f) => f.slug === item.filmSlug || f.title.toLowerCase() === item.filmTitle.toLowerCase(),
        );
        const poster = item.poster || matchedFilm?.poster || "";
        const frames: Frame[] = item.images.map((img, idx) => ({
          src: img.url,
          pos: "object-center",
          ratio: FRAME_RATIO,
          no: String(idx + 1).padStart(2, "0"),
        }));

        return {
          film: {
            title: item.filmTitle,
            slug:
              item.filmSlug ||
              matchedFilm?.slug ||
              item.filmTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            genre: item.genre || matchedFilm?.genre || "Cinema",
            year: item.year || matchedFilm?.year || 2026,
            poster,
          },
          frames:
            frames.length > 0
              ? frames
              : poster
                ? [{ src: poster, pos: "object-center", ratio: FRAME_RATIO, no: "01" }]
                : [],
        };
      });
    }
    return buildSets(films);
  }, [gallery, films]);
  const [open, setOpen] = useState<{ set: number; frame: number } | null>(null);

  // Lightbox: Escape closes, arrow keys move within the open film's set.
  useEffect(() => {
    if (open === null) return;
    const frames = sets[open.set]!.frames;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight")
        setOpen((o) => (o ? { ...o, frame: (o.frame + 1) % frames.length } : o));
      if (e.key === "ArrowLeft")
        setOpen((o) => (o ? { ...o, frame: (o.frame - 1 + frames.length) % frames.length } : o));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, sets]);

  const active = open ? sets[open.set]! : null;
  const frame = open && active ? active.frames[open.frame]! : null;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <PageTitle eyebrow={`${sets.length} photo sets`} title="The" outline="Gallery" />
      <div className="mx-auto max-w-[1600px] space-y-20 px-5 pb-24 md:space-y-28 md:px-10">
        {sets.map((s, si) => (
          <Reveal key={s.film.slug}>
            {/* Film heading */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                  {s.film.genre} · {s.film.year}
                </p>
                <h2 className="mt-2 font-display text-4xl leading-none md:text-5xl">
                  {s.film.title}
                </h2>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  {pad(s.frames.length)} photos
                </span>
                <Link
                  to={`/films/${s.film.slug}`}
                  className="font-sans text-xs font-bold uppercase tracking-tight text-foreground underline-offset-8 transition-colors hover:text-neon-ink hover:underline"
                >
                  Details →
                </Link>
              </div>
            </div>

            {/* That film's photo set — four tiles per row */}
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 md:gap-6 lg:gap-8 lg:gap-y-10">
              {s.frames.map((fr, fi) => (
                <button
                  key={fr.no}
                  type="button"
                  onClick={() => setOpen({ set: si, frame: fi })}
                  aria-label={`Open ${s.film.title} photo ${fr.no}`}
                  className={`group relative block h-full w-full overflow-hidden rounded-2xl bg-card ${fr.ratio}`}
                >
                  <img
                    src={fr.src}
                    alt={`${s.film.title} — photo ${fr.no}`}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-cover ${fr.pos} transition-transform duration-[1.2s] ease-out group-hover:scale-105`}
                  />
                  <div className="absolute inset-0 scrim-b opacity-60 transition-opacity duration-500 group-hover:opacity-90" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 font-sans text-[10px] font-bold uppercase tracking-tight text-white backdrop-blur">
                    {fr.no}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>
        ))}
      </div>

      <AnimatePresence>
        {active && frame && open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${active.film.title} — photo ${frame.no}`}
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
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) =>
                  o
                    ? { ...o, frame: (o.frame - 1 + active.frames.length) % active.frames.length }
                    : o,
                );
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
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((o) => (o ? { ...o, frame: (o.frame + 1) % active.frames.length } : o));
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

            <motion.div
              key={`${active.film.slug}-${frame.no}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={`relative max-h-[75vh] w-auto max-w-[82vw] overflow-hidden rounded-2xl sm:max-w-[88vw] md:max-w-4xl ${frame.ratio}`}
            >
              <img
                src={frame.src}
                alt={`${active.film.title} — photo ${frame.no}`}
                className={`h-full w-full object-cover ${frame.pos}`}
              />
            </motion.div>

            <div className="text-center" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-2xl md:text-3xl">{active.film.title}</p>
              <p className="mt-1 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                {active.film.genre} — {frame.no} / {pad(active.frames.length)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
