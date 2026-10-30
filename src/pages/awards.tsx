import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";

import { useAwards, useFilmLookup } from "@/lib/content";
import laurelImg from "@/assets/laurel.png";
import type { Award, Film } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, PlayButton, Reveal, ScreenRequestButton, TrailerModal } from "@/components/site";

const categories = ["All", "Major Prize", "Selection", "Craft", "Audience"] as const;

type FilterCategory = (typeof categories)[number];

const categoryLabels: Record<FilterCategory, string> = {
  All: "All Awards",
  "Major Prize": "Major Prizes",
  Selection: "Official Selections",
  Craft: "Craft & Technical",
  Audience: "Audience Awards",
};

/** Chip/dot colors per award type — green for the top prizes, ink for
 *  selections, pink for craft, quiet grey for audience awards. */
const categoryTone: Record<Exclude<FilterCategory, "All">, { chip: string; dot: string }> = {
  "Major Prize": {
    chip: "bg-neon text-primary-foreground",
    dot: "bg-neon-ink",
  },
  Selection: {
    chip: "bg-foreground text-background",
    dot: "bg-foreground",
  },
  Craft: {
    chip: "bg-accent text-accent-foreground",
    dot: "bg-accent",
  },
  Audience: {
    chip: "bg-secondary text-foreground ring-1 ring-border",
    dot: "bg-muted-foreground",
  },
};

const stats = [
  { value: 118, label: "Festival Awards" },
  { value: 9, label: "Academy Noms" },
  { value: 3, label: "Grand Jury Prizes" },
  { value: 6, label: "Global Premieres" },
];

/** Counts up once the stat scrolls into view (skipped for reduced motion). */
function StatBlock({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce || typeof requestAnimationFrame !== "function") {
      setShown(stat.value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 900 + index * 140;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(stat.value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, stat.value, index]);

  return (
    <div ref={ref} className="bg-background p-6 sm:p-8">
      <p className="font-display text-5xl text-neon-ink sm:text-7xl">{shown}</p>
      <p className="mt-2 font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
        {stat.label}
      </p>
    </div>
  );
}

/** Authentic cinema golden laurel wreath image. */
function LaurelWreath({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <img
      src={laurelImg}
      alt="Cinema Laurel"
      loading="lazy"
      className={`object-contain transition-transform duration-500 group-hover:scale-110 ${className}`}
    />
  );
}

/** The single honor the page opens with: poster on the left, citation on the
 *  right, on a dark stage so it reads as the headline act. */
function FeaturedHonor({
  item,
  rank,
  onTrailer,
}: {
  item: Award;
  rank: number;
  onTrailer: (film: Film) => void;
}) {
  const getFilm = useFilmLookup();
  const awardsList = useAwards();
  const film = getFilm(item.filmSlug);
  const tone = categoryTone[item.category];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="group theme-dark relative mb-8 overflow-hidden rounded-3xl border border-border bg-background text-foreground"
    >
      <div className="grid md:grid-cols-2">
        {/* Poster stage */}
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[440px]">
          {film && (
            <img
              src={film.poster}
              alt={film.title}
              className="absolute inset-0 h-full w-full object-cover grayscale-[35%] transition-all duration-[1.4s] ease-out group-hover:scale-105 group-hover:grayscale-0"
            />
          )}
          <div className="absolute inset-0 scrim-b opacity-90" />
          <span
            className={`absolute left-5 top-5 rounded-full px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-tight ${tone.chip}`}
          >
            {item.category}
          </span>
          <span className="absolute right-5 top-5 font-sans text-xs font-bold uppercase tracking-tight text-white/75">
            {String(rank).padStart(2, "0")} / {awardsList.length}
          </span>
        </div>

        {/* Citation */}
        <div className="flex flex-col justify-center gap-5 p-6 md:p-10">
          <div className="flex items-center gap-4">
            <LaurelWreath className="h-10 w-10 shrink-0 text-neon-ink transition-transform duration-500 group-hover:scale-110" />
            <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
              {item.festival}
              <span className="text-muted-foreground"> · {item.year}</span>
            </p>
          </div>

          <div>
            <p className="font-sans text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
              Headline award
            </p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl lg:text-6xl">{item.award}</h2>
          </div>

          <blockquote className="border-l-2 border-neon-ink pl-4 text-base italic leading-relaxed text-foreground/85 md:text-lg">
            “{item.citation}”
          </blockquote>

          <div className="flex flex-wrap items-center gap-6 pt-1">
            {film && (
              <>
                <PlayButton onClick={() => onTrailer(film)} label="Trailer" color={film.accent} />
                <ScreenRequestButton film={film} color={film.accent} />
                <Link
                  to={`/films/${film.slug}`}
                  className="font-sans text-xs font-bold uppercase tracking-tight underline-offset-8 hover:text-neon-ink hover:underline"
                >
                  {film.title} →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function AwardsPage() {
  usePageMeta({
    title: "Awards & Accolades — Fragrant Nature",
    description:
      "Explore the festival acclaim, major awards, and global honors earned by Fragrant Nature film releases.",
  });

  const awardsList = useAwards();
  const getFilm = useFilmLookup();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [trailerFilm, setTrailerFilm] = useState<Film | null>(null);

  const filteredAwards = awardsList.filter(
    (a) => activeFilter === "All" || a.category === activeFilter,
  );
  const [featured, ...rest] = filteredAwards;

  const countFor = (cat: FilterCategory) =>
    cat === "All" ? awardsList.length : awardsList.filter((a) => a.category === cat).length;

  const festivals = Array.from(new Set(awardsList.map((a) => a.festival)));

  return (
    <>
      <PageTitle eyebrow="118 Global Awards" title="Festival" outline="Awards" />

      {/* Dark awards band: count-up milestones + a marquee of the festivals */}
      <section className="theme-dark border-y border-border bg-background text-foreground">
        <div className="mx-auto max-w-[1600px] px-5 pt-12 md:px-10">
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
            {stats.map((s, i) => (
              <StatBlock key={s.label} stat={s} index={i} />
            ))}
          </div>
        </div>
        <div className="mt-12 overflow-hidden border-t border-border py-4">
          <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-3xl md:text-5xl">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex gap-12">
                {festivals.map((f, i) => (
                  <span key={f} className={i % 2 ? "text-outline" : "text-neon-ink"}>
                    {f}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 pb-24 pt-14 md:px-10">
        {/* Filter pills + live result count */}
        <Reveal className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter awards">
              {categories.map((cat) => {
                const active = activeFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveFilter(cat)}
                    aria-pressed={active}
                    className={`group relative rounded-full border px-5 py-2 font-sans text-xs font-bold uppercase tracking-tight transition-colors duration-300 ${
                      active
                        ? "border-neon"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="award-filter-pill"
                        className="absolute inset-0 rounded-full bg-neon"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span className={`relative z-10 ${active ? "text-primary-foreground" : ""}`}>
                      {categoryLabels[cat]}
                    </span>
                    <span
                      className={`relative z-10 ml-2 ${
                        active ? "text-primary-foreground/70" : "text-muted-foreground/70"
                      }`}
                    >
                      {countFor(cat)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="font-sans text-xs font-semibold uppercase tracking-tight text-muted-foreground">
              Showing {filteredAwards.length} of {awardsList.length} awards
            </p>
          </div>
        </Reveal>

        {/* Headline honor */}
        <AnimatePresence mode="wait">
          {featured && (
            <FeaturedHonor
              key={featured.id}
              item={featured}
              rank={awardsList.findIndex((a) => a.id === featured.id) + 1}
              onTrailer={setTrailerFilm}
            />
          )}
        </AnimatePresence>

        {/* Remaining honors as poster cards */}
        <motion.div layout className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {rest.map((item: Award) => {
              const film = getFilm(item.filmSlug);
              const tone = categoryTone[item.category];
              const rank = awardsList.findIndex((a) => a.id === item.id) + 1;
              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/40 transition-all duration-500 hover:-translate-y-1 hover:border-foreground/30 hover:bg-card hover:shadow-[0_24px_60px_-32px_rgba(0,0,0,0.45)]"
                >
                  {/* Poster with festival caption */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-card">
                    {film && (
                      <img
                        src={film.poster}
                        alt={film.title}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover grayscale-[45%] transition-all duration-[1.2s] ease-out group-hover:scale-105 group-hover:grayscale-0"
                      />
                    )}
                    <div className="absolute inset-0 scrim-b opacity-90" />
                    <span
                      className={`absolute left-4 top-4 rounded-full px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-tight ${tone.chip}`}
                    >
                      {item.category}
                    </span>
                    <span className="absolute right-4 top-4 font-sans text-[11px] font-bold uppercase tracking-tight text-white/75">
                      {String(rank).padStart(2, "0")}
                    </span>
                    <div className="absolute inset-x-4 bottom-4">
                      <p className="font-sans text-[11px] font-bold uppercase tracking-tight text-neon">
                        {item.festival}
                        <span className="text-white/60"> · {item.year}</span>
                      </p>
                      <h3 className="mt-1.5 font-display text-2xl text-white transition-colors duration-300 group-hover:text-neon md:text-3xl">
                        {item.award}
                      </h3>
                    </div>
                  </div>

                  {/* Citation + awarded film */}
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <p className="font-sans text-[11px] font-bold uppercase tracking-tight text-muted-foreground">
                      Jury citation
                    </p>
                    <blockquote className="mt-2 flex gap-3 text-[15px] italic leading-relaxed text-foreground/85">
                      <span
                        aria-hidden="true"
                        className="font-display text-3xl leading-none text-neon-ink"
                      >
                        “
                      </span>
                      <span>{item.citation}</span>
                    </blockquote>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
                      <div className="min-w-0">
                        <p className="font-sans text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                          Awarded film
                        </p>
                        {film && (
                          <>
                            <Link
                              to={`/films/${film.slug}`}
                              className="mt-1 block truncate font-display text-lg transition-colors hover:text-neon-ink"
                            >
                              {film.title}
                            </Link>
                            <p className="truncate font-sans text-xs font-medium text-muted-foreground">
                              Dir. {film.director} · {film.year}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {film && (
                          <button
                            type="button"
                            onClick={() => setTrailerFilm(film)}
                            className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Trailer
                          </button>
                        )}
                        {film && (
                          <Link
                            to={`/films/${film.slug}`}
                            className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink underline-offset-4 hover:underline"
                          >
                            Explore →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Empty state — every filter currently has matches, but keep it graceful */}
        {filteredAwards.length === 0 && (
          <p className="border border-border bg-card/40 p-10 text-center font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            No awards in this category yet.
          </p>
        )}

        <Reveal className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-border pt-8">
            <p className="max-w-2xl font-display text-3xl md:text-5xl">
              Every award belongs to <span className="text-neon-ink">a film</span>.
            </p>
            <Link
              to="/films"
              className="font-mono text-xs uppercase tracking-[0.25em] hover:text-neon-ink"
            >
              See the slate →
            </Link>
          </div>
        </Reveal>
      </div>

      {trailerFilm && <TrailerModal film={trailerFilm} open onClose={() => setTrailerFilm(null)} />}
    </>
  );
}
