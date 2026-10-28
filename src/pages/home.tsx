import { Link } from "react-router";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { Award, Film } from "@/lib/films";
import { useAwards, useContent, useFilmLookup, useFilms } from "@/lib/content";
import { useLikes } from "@/lib/likes";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PlayButton, Reveal, ScreenRequestButton, TrailerModal } from "@/components/site";

const SLIDE_DURATION = 7000;

function HeroCarousel() {
  const films = useFilms();
  // The hero rotates the films the admin marked as featured (static
  // catalogue: every film qualifies).
  const featured = films.filter((f) => f.featured ?? true);
  const slides = featured.length ? featured : films;
  const [index, setIndex] = useState(0);
  const [nav, setNav] = useState(0);
  const [progress, setProgress] = useState(0);
  const [trailer, setTrailer] = useState(false);
  const film = slides[Math.min(index, Math.max(slides.length - 1, 0))]!;
  const { likes, toggle: toggleLike } = useLikes();
  const liked = likes.includes(film.slug);

  const sectionRef = useRef<HTMLElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const [cursorDirection, setCursorDirection] = useState<"left" | "right">("right");

  const mouseX = useMotionValue(-500);
  const mouseY = useMotionValue(-500);
  const smoothX = useSpring(mouseX, { damping: 28, stiffness: 320, mass: 0.35 });
  const smoothY = useSpring(mouseY, { damping: 28, stiffness: 320, mass: 0.35 });

  // Manual navigation: jump to a specific slide or step by delta, always
  // wrapping. Bumping `nav` remounts the autoplay effect, so the timer and
  // progress bar restart from zero on every manual change.
  const goTo = (i: number) => {
    setIndex(((i % slides.length) + slides.length) % slides.length);
    setNav((n) => n + 1);
  };

  // NEON-style parallax: the frame drifts slower than the page while the
  // hero scrolls away (the wrapper is oversized so no gap can appear).
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 800], [0, 70]);

  // Autoplay: advance to the next slide, driving the progress bar as we go.
  useEffect(() => {
    if (trailer) return;
    setProgress(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      const p = (Date.now() - started) / SLIDE_DURATION;
      if (p >= 1) {
        setIndex((i) => (i + 1) % slides.length);
      } else {
        setProgress(p);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [index, nav, trailer, slides.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    mouseX.set(relX);
    mouseY.set(relY);

    setCursorDirection(relX >= rect.width / 2 ? "right" : "left");

    const target = e.target as HTMLElement | null;
    const isInteractive = Boolean(
      target?.closest(
        "button, a, input, select, textarea, [role='dialog'], [data-interactive='true']",
      ),
    );
    setIsOverInteractive(isInteractive);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (sectionRef.current) {
      const rect = sectionRef.current.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      mouseX.jump(relX);
      mouseY.jump(relY);
      setCursorDirection(relX >= rect.width / 2 ? "right" : "left");
    }
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsOverInteractive(false);
  };

  const handleSectionClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, [role='dialog'], [data-interactive='true']",
      )
    ) {
      return;
    }
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    if (relX < rect.width / 2) {
      goTo(index - 1);
    } else {
      goTo(index + 1);
    }
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleSectionClick}
      className={`theme-dark relative h-[100svh] overflow-hidden bg-background text-foreground select-none ${
        isHovering && !isOverInteractive && !trailer ? "md:cursor-none" : ""
      }`}
      style={{ "--hero-accent": film.accent } as CSSProperties}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={film.slug}
          className="absolute inset-x-0 -top-[15%] h-[130%]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          style={{ y: parallaxY }}
        >
          <img
            src={film.poster}
            alt={film.title}
            fetchPriority="high"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover ${index % 2 === 0 ? "hero-drift" : "hero-drift-alt"}`}
          />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 scrim-b" />
      <div className="absolute inset-0 bg-gradient-to-r from-scrim/85 via-scrim/40 to-transparent" />

      <div className="relative z-10 flex h-full items-center px-5 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={film.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="w-full max-w-[1200px]"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-sans text-xs font-bold uppercase tracking-tight text-[color:var(--hero-accent)] transition-colors duration-700"
            >
              {film.status === "now" ? "Now in theaters" : "Coming soon"} — {film.laurels[0]}
            </motion.p>
            <h1 className="mt-4 flex flex-wrap items-end gap-x-[0.18em] gap-y-[0.04em] pb-8 font-display text-[clamp(3rem,11vw,10rem)] uppercase leading-[0.82] text-[color:var(--hero-accent)] transition-colors duration-700">
              {film.title.split(" ").map((w, i) => (
                <span key={w} className="inline-block overflow-hidden">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1 + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
            >
              <PlayButton onClick={() => setTrailer(true)} color={film.accent} />
              <ScreenRequestButton film={film} color={film.accent} />
              <button
                type="button"
                onClick={() => toggleLike(film.slug)}
                aria-pressed={liked}
                aria-label={liked ? `Unlike ${film.title}` : `Like ${film.title}`}
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
                  liked
                    ? "border-[var(--hero-accent)] bg-[var(--hero-accent)] text-primary-foreground"
                    : "border-white/70 text-white hover:border-[var(--hero-accent)] hover:bg-[var(--hero-accent)] hover:text-primary-foreground"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <span className="font-sans text-xs font-bold uppercase tracking-tight text-white/75">
                {film.year} · {film.genre}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-8 z-10 flex items-center justify-center px-5 md:bottom-10">
        <div className="flex items-center gap-2.5">
          {slides.map((f, i) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${f.title}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full border transition-all duration-300 ${
                i === index
                  ? "w-8 border-[var(--hero-accent)] bg-[var(--hero-accent)]"
                  : "w-2 border-white/60 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-white/15">
        <div
          className="h-full bg-[var(--hero-accent)] transition-colors duration-700"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* NEON-style interactive cursor follower: follows pointer inside hero hover area */}
      <motion.div
        className="pointer-events-none absolute z-30 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center text-[var(--hero-accent)] md:flex"
        style={{
          x: smoothX,
          y: smoothY,
          top: 0,
          left: 0,
        }}
        animate={{
          opacity: isHovering && !isOverInteractive && !trailer ? 1 : 0,
          scale: isHovering && !isOverInteractive && !trailer ? 1 : 0.4,
          scaleX: cursorDirection === "right" ? 1 : -1,
        }}
        transition={{
          opacity: { duration: 0.15, ease: "easeOut" },
          scale: { duration: 0.2, ease: "easeOut" },
          scaleX: { duration: 0.22, ease: "easeInOut" },
        }}
      >
        <svg
          viewBox="0 0 100 32"
          fill="none"
          className="h-10 w-32 md:h-12 md:w-44 drop-shadow-[0_0_16px_var(--hero-accent)] transition-colors duration-500"
          aria-hidden
        >
          {/* Horizontal shaft */}
          <line
            x1="4"
            y1="16"
            x2="94"
            y2="16"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
          />
          {/* Symmetrical sharp arrowhead wings matching NEON */}
          <path
            d="M74 2 L94 16 L74 30"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      <TrailerModal film={film} open={trailer} onClose={() => setTrailer(false)} />
    </section>
  );
}

/** NEON-style "Watch Now" strip — horizontally scrolling 16:9 stills with
 *  hover actions (like + trailer) and prev/next controls in the heading. */
function WatchNow() {
  const films = useFilms();
  const rowRef = useRef<HTMLDivElement>(null);
  const { likes, toggle } = useLikes();
  const [trailerFilm, setTrailerFilm] = useState<Film>(films[0] as Film);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const nudge = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: dir * Math.max(260, Math.round(row.clientWidth * 0.7)),
      behavior: "smooth",
    });
  };

  return (
    <section className="border-b border-border">
      <div className="mx-auto mb-8 flex max-w-[1600px] flex-wrap items-end justify-between gap-4 px-5 pt-24 md:px-10">
        <Reveal className="flex items-end gap-4 md:gap-6">
          <h2 className="font-display text-4xl leading-none md:text-5xl">
            Watch
            <br />
            <span className="text-neon-ink">Now</span>
          </h2>
          <div className="flex gap-2 pb-1">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Scroll to previous titles"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground"
            >
              <svg viewBox="0 0 9 8" fill="currentColor" className="h-2.5 w-3" aria-hidden>
                <path d="M8.71385 4.30769L1.17538 4.30769L4.40615 7.53846L4 8L0 4L4 0L4.40615 0.461538L1.17538 3.69231L8.71385 3.69231L8.71385 4.30769Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Scroll to next titles"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground"
            >
              <svg viewBox="0 0 10 8" fill="currentColor" className="h-2.5 w-3" aria-hidden>
                <path d="M0.713888 3.69231L8.25235 3.69231L5.02158 0.461538L5.42773 0L9.42773 4L5.42773 8L5.02158 7.53846L8.25235 4.30769L0.713888 4.30769L0.713888 3.69231Z" />
              </svg>
            </button>
          </div>
        </Reveal>
        <Link
          to="/films"
          className="font-sans text-xs font-bold uppercase tracking-tight hover:underline hover:text-neon-ink"
        >
          All movies →
        </Link>
      </div>

      <div
        ref={rowRef}
        className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-pl-5 px-5 pb-24 md:scroll-pl-10 md:px-10"
      >
        {films.map((f, i) => {
          const liked = likes.includes(f.slug);
          return (
            <div
              key={f.slug}
              className="group w-[264px] shrink-0 snap-start sm:w-[300px] md:w-[340px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-card">
                <img
                  src={f.poster}
                  alt={`${f.title} still`}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 scrim-b opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
                {f.status === "upcoming" && (
                  <span className="absolute left-3 top-3 rounded-full border border-white/50 bg-black/45 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
                    Coming soon
                  </span>
                )}
                <Link
                  to={`/films/${f.slug}`}
                  aria-label={`View ${f.title}`}
                  className="absolute inset-0 rounded-2xl"
                />
                <div className="pointer-events-none absolute bottom-3 left-3 flex gap-2 text-white opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => toggle(f.slug)}
                    aria-pressed={liked}
                    aria-label={liked ? `Unlike ${f.title}` : `Like ${f.title}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:text-neon ${liked ? "text-neon" : ""}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTrailerFilm(f);
                      setTrailerOpen(true);
                    }}
                    aria-label={`Play ${f.title} trailer`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:text-neon"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M7 4.5l12 7.5-12 7.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-hidden
                >
                  <path d="M5.3522 5H19M19 5V18.6478M19 5L5 19" />
                </svg>
                <Link
                  to={`/films/${f.slug}`}
                  className="font-sans text-sm font-bold uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-1 hover:text-neon-ink"
                >
                  {f.title}
                </Link>
                <span className="ml-auto font-sans text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                  {f.year}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <TrailerModal film={trailerFilm} open={trailerOpen} onClose={() => setTrailerOpen(false)} />
    </section>
  );
}

/** Cannes Palme d'Or / Festival laurel icon matching NEON's laurel badge */
function CannesLaurelIcon({ className = "h-5 w-auto shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 38 22"
      fill="currentColor"
      className={className}
      aria-label="Cannes Palme d'Or"
    >
      <path
        d="M4 17.5C1.8 14.5.8 10.5 2 6c1.2 2.6 2.8 4.6 4.8 5.6C4.8 8 5 4.5 6.8 1.8c1.4 2.4 3 4.2 4.4 5.5-1.5-3.2-1.3-6.2.2-8.5 1.5 2 2.7 4 3.4 5.8 0-2.5.6-4.8 1.8-6.5.6 2.2 1 4.2 1 6.2M34 17.5c2.2-3 3.2-7 2-11.5-1.2 2.6-2.8 4.6-4.8 5.6 2-3.6 1.8-7.1 0-9.8-1.4 2.4-3 4.2-4.4 5.5 1.5-3.2 1.3-6.2-.2-8.5-1.5 2-2.7 4-3.4 5.8 0-2.5-.6-4.8-1.8-6.5-.6 2.2-1 4.2-1 6.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse
        cx="19"
        cy="11"
        rx="4.8"
        ry="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="19"
        y1="4.5"
        x2="19"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M16.5 7.5c1.2.6 2.5 1 2.5 1M21.5 7.5c-1.2.6-2.5 1-2.5 1M16 10.5c1.5.6 3 1 3 1M22 10.5c-1.5.6-3 1-3 1M16.5 13.5c1.2.5 2.5.8 2.5.8M21.5 13.5c-1.2.5-2.5.8-2.5.8"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Academy Award / Oscar Statuette silhouette matching NEON */
function OscarStatueIcon({ className = "h-5 w-auto shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 26" fill="currentColor" className={className} aria-label="Academy Award">
      <circle cx="7" cy="3" r="1.9" />
      <path d="M5.1 6.2h3.8c.7 0 1.2.5 1.2 1.2v5.2c0 .4-.2.8-.5 1.1L8.2 19.5H5.8L4.4 13.7c-.3-.3-.5-.7-.5-1.1V7.4c0-.7.5-1.2 1.2-1.2z" />
      <line x1="7" y1="7.8" x2="7" y2="15.5" stroke="currentColor" strokeWidth="0.75" />
      <rect x="3.8" y="20.2" width="6.4" height="1.6" rx="0.4" />
      <rect x="2.6" y="22.4" width="8.8" height="2.2" rx="0.5" />
    </svg>
  );
}

/** Festival laurel wreath matching NEON */
function FestivalWreathIcon({
  className = "h-5 w-auto shrink-0",
  title = "Festival Winner",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 34 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      className={className}
      aria-label={title}
    >
      <path
        d="M4 17.5C1.8 14.5.8 10.5 2 6c1.2 2.6 2.8 4.6 4.8 5.6C4.8 8 5 4.5 6.8 1.8c1.4 2.4 3 4.2 4.4 5.5M30 17.5c2.2-3 3.2-7 2-11.5-1.2 2.6-2.8 4.6-4.8 5.6 2-3.6 1.8-7.1 0-9.8-1.4 2.4-3 4.2-4.4 5.5"
        strokeLinecap="round"
      />
      <circle
        cx="17"
        cy="11"
        r="3.2"
        fill="currentColor"
        fillOpacity={0.25}
        stroke="currentColor"
        strokeWidth={1}
      />
      <path d="M17 8.5v5M14.5 11h5" stroke="currentColor" strokeWidth={1} strokeLinecap="round" />
    </svg>
  );
}

/** Award Winners section matching the exact design of neonrated.com */
function AwardWinners() {
  const rowRef = useRef<HTMLDivElement>(null);
  const getFilm = useFilmLookup();
  const awardsList = useAwards();
  const [trailerFilm, setTrailerFilm] = useState<Film | null>(null);
  const { likes, toggle: toggleLike } = useLikes();

  const nudge = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: dir * Math.max(320, Math.round(row.clientWidth * 0.75)),
      behavior: "smooth",
    });
  };

  // Straight from the awards collection — the rail shows whichever honors the
  // admin has on file, paired with the film each honor belongs to.
  const awardFilms = awardsList
    .map((award) => ({ award, film: getFilm(award.filmSlug) }))
    .filter((entry): entry is { award: Award; film: Film } => Boolean(entry.film))
    .slice(0, 8)
    .map(({ award, film }) => ({
      award,
      film,
      icons: (
        <>
          {award.category === "Major Prize" ? (
            <CannesLaurelIcon className="h-4.5 w-auto" />
          ) : (
            <FestivalWreathIcon title={award.award} className="h-4.5 w-auto" />
          )}
          <OscarStatueIcon className="h-5 w-auto" />
        </>
      ),
    }));

  return (
    <section className="border-b border-border">
      <div className="mx-auto mb-6 flex max-w-[1600px] flex-wrap items-end justify-between gap-4 px-5 pt-20 md:px-10">
        <div className="flex items-end gap-4 md:gap-6">
          <h2 className="font-display text-4xl uppercase leading-none md:text-5xl lg:text-6xl">
            Award
            <br />
            <span className="text-neon-ink">Winners</span>
          </h2>
          <div className="flex gap-2 pb-1">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="Scroll to previous award winners"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground"
            >
              <svg viewBox="0 0 9 8" fill="currentColor" className="h-2.5 w-3" aria-hidden>
                <path d="M8.71385 4.30769L1.17538 4.30769L4.40615 7.53846L4 8L0 4L4 0L4.40615 0.461538L1.17538 3.69231L8.71385 3.69231L8.71385 4.30769Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="Scroll to next award winners"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:border-foreground"
            >
              <svg viewBox="0 0 10 8" fill="currentColor" className="h-2.5 w-3" aria-hidden>
                <path d="M0.713888 3.69231L8.25235 3.69231L5.02158 0.461538L5.42773 0L9.42773 4L5.42773 8L5.02158 7.53846L8.25235 4.30769L0.713888 4.30769L0.713888 3.69231Z" />
              </svg>
            </button>
          </div>
        </div>

        <Link
          to="/awards"
          className="font-sans text-xs font-bold uppercase tracking-tight hover:underline hover:text-neon-ink"
        >
          All honors →
        </Link>
      </div>

      <div
        ref={rowRef}
        className="no-scrollbar flex snap-x gap-5 overflow-x-auto scroll-pl-5 px-5 pb-20 md:scroll-pl-10 md:px-10"
      >
        {awardFilms.map(({ award, film: f, icons }, index) => {
          const liked = likes.includes(f.slug);
          return (
            <div
              key={`${f.slug}-${award.id ?? index}`}
              className="group w-[75vw] shrink-0 snap-start sm:w-[320px] md:w-[350px] lg:w-[380px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-card">
                <img
                  src={f.poster}
                  alt={`${f.title} still`}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 scrim-b opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
                <Link
                  to={`/films/${f.slug}`}
                  aria-label={`View ${f.title}`}
                  className="absolute inset-0 rounded-2xl"
                />
                <div className="pointer-events-none absolute bottom-3.5 left-3.5 flex gap-2 text-white opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => toggleLike(f.slug)}
                    aria-pressed={liked}
                    aria-label={liked ? `Unlike ${f.title}` : `Like ${f.title}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:text-neon ${liked ? "text-neon" : ""}`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={1.6}
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrailerFilm(f)}
                    aria-label={`Play ${f.title} trailer`}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur transition-colors hover:text-neon"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M7 4.5l12 7.5-12 7.5z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 px-0.5">
                <Link
                  to={`/films/${f.slug}`}
                  className="font-sans text-sm font-bold uppercase tracking-tight transition-colors group-hover:text-neon-ink md:text-base"
                >
                  {f.title}
                </Link>
                <span className="flex shrink-0 items-center gap-1.5 text-neon-ink" aria-hidden>
                  {icons}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kept mounted while a winner exists so the modal's exit animation runs. */}
      {awardFilms[0] && (
        <TrailerModal
          film={trailerFilm ?? awardFilms[0].film}
          open={Boolean(trailerFilm)}
          onClose={() => setTrailerFilm(null)}
        />
      )}
    </section>
  );
}

export function HomePage() {
  usePageMeta({
    title: "Fragrant Nature — Independent Cinema, Loud",
    description:
      "Fragrant Nature is an independent film studio releasing bold, award-winning cinema.",
  });

  const { films, news } = useContent();
  const [f1, f2, f3] = films.filter((f) => f.status === "now");
  const [active, setActive] = useState(0);

  return (
    <>
      <HeroCarousel />

      <section>
        <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10">
          <div className="mb-12 flex items-end justify-between">
            <Reveal>
              <h2 className="font-display text-5xl md:text-7xl">
                Now
                <br />
                <span className="text-neon-ink">Showing</span>
              </h2>
            </Reveal>
            <Link
              to="/films"
              className="font-sans text-xs font-bold uppercase tracking-tight hover:underline hover:text-neon-ink"
            >
              All movies →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-12">
            {f1 && (
              <div className="md:col-span-7">
                <FilmCard film={f1} index={0} tall aspect="aspect-[4/3]" />
              </div>
            )}
            {(f2 || f3) && (
              <div className="grid gap-5 md:col-span-5">
                {f2 && <FilmCard film={f2} index={1} aspect="aspect-[2/1]" />}
                {f3 && <FilmCard film={f3} index={2} aspect="aspect-[2/1]" />}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="theme-dark border-y border-border bg-background py-24 text-foreground">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="mb-8 font-sans text-xs font-bold uppercase tracking-tight text-accent">
            Coming soon
          </p>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              {films
                .filter((f) => f.status === "upcoming")
                .map((f, i) => (
                  <Link
                    key={f.slug}
                    to={`/films/${f.slug}`}
                    onMouseEnter={() => setActive(i)}
                    className="group flex items-baseline justify-between border-b border-border py-6"
                  >
                    <span
                      className={`font-display text-4xl transition-all duration-500 md:text-6xl ${active === i ? "translate-x-4 text-neon-ink" : "text-outline"}`}
                    >
                      {f.title}
                    </span>
                    <span className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                      {f.release}
                    </span>
                  </Link>
                ))}
            </div>
            <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl bg-card md:block">
              {films
                .filter((f) => f.status === "upcoming")
                .map((f, i) => (
                  <motion.img
                    key={f.slug}
                    src={f.poster}
                    alt={f.title}
                    loading="lazy"
                    decoding="async"
                    animate={{ opacity: active === i ? 1 : 0, scale: active === i ? 1 : 1.15 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      <WatchNow />

      <section>
        <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10">
          <Reveal>
            <p className="max-w-5xl font-display text-3xl md:text-6xl">
              We make movies that <span className="text-accent">refuse</span> to be ignored.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-px bg-border md:grid-cols-4">
            {[
              ["42", "Movies released"],
              ["118", "Festival awards"],
              ["9", "Oscar noms"],
              ["∞", "Midnight screenings"],
            ].map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.08} className="bg-background p-8">
                <p className="font-display text-6xl text-neon-ink">{n}</p>
                <p className="mt-2 font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                  {l}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AwardWinners />

      <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-5xl">Dispatch</h2>
          <Link
            to="/news"
            className="font-sans text-xs font-bold uppercase tracking-tight hover:underline hover:text-neon-ink"
          >
            All news →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {news.slice(0, 3).map((n, i) => (
            <Reveal key={n.id} delay={i * 0.1}>
              <Link to={`/news/${n.id}`} className="group block">
                <div className="aspect-video overflow-hidden rounded-2xl">
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <p className="mt-4 font-sans text-[11px] font-bold uppercase tracking-tight text-neon-ink">
                  {n.tag} — {n.date}
                </p>
                <h3 className="mt-2 text-2xl font-bold group-hover:underline">{n.title}</h3>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
