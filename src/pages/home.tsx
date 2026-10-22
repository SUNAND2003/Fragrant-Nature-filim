import { Link } from "react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";

import { films, news, type Film } from "@/lib/films";
import { useLikes } from "@/lib/likes";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PlayButton, Reveal, TrailerModal } from "@/components/site";

const SLIDE_DURATION = 7000;

function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [nav, setNav] = useState(0);
  const [progress, setProgress] = useState(0);
  const [trailer, setTrailer] = useState(false);
  const film = films[index]!;
  const { likes, toggle: toggleLike } = useLikes();
  const liked = likes.includes(film.slug);

  // Manual navigation: jump to a specific slide or step by delta, always
  // wrapping. Bumping `nav` remounts the autoplay effect, so the timer and
  // progress bar restart from zero on every manual change.
  const goTo = (i: number) => {
    setIndex(((i % films.length) + films.length) % films.length);
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
        setIndex((i) => (i + 1) % films.length);
      } else {
        setProgress(p);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [index, nav, trailer]);

  return (
    <section
      className="theme-dark relative h-[100svh] overflow-hidden bg-background text-foreground"
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
              className="font-mono text-xs uppercase tracking-[0.3em] text-[color:var(--hero-accent)] transition-colors duration-700"
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
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-white/75">
                {film.year} · {film.genre}
              </span>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute inset-x-0 bottom-10 z-10 flex items-center justify-center gap-6 px-5 md:px-10">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label="Previous movie"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-[var(--hero-accent)] hover:bg-[var(--hero-accent)] hover:text-primary-foreground"
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

        <div className="flex gap-2.5">
          {films.map((f, i) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show ${f.title}`}
              aria-current={i === index}
              className={`h-2 rounded-full border transition-all duration-300 ${
                i === index
                  ? "w-7 border-[var(--hero-accent)] bg-[var(--hero-accent)]"
                  : "w-2 border-white/60 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label="Next movie"
          className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-[var(--hero-accent)] hover:bg-[var(--hero-accent)] hover:text-primary-foreground"
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
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-white/15">
        <div
          className="h-full bg-[var(--hero-accent)] transition-colors duration-700"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <TrailerModal film={film} open={trailer} onClose={() => setTrailer(false)} />
    </section>
  );
}

export function HomePage() {
  usePageMeta({
    title: "Fragrant Nature — Independent Cinema, Loud",
    description:
      "Fragrant Nature is an independent film studio releasing bold, award-winning cinema.",
  });

  const [, f1, f2, f3] = films as [Film, Film, Film, Film, ...Film[]];
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
              className="font-mono text-xs uppercase tracking-[0.25em] hover:text-neon-ink"
            >
              All movies →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-12">
            <div className="md:col-span-7">
              <FilmCard film={f1} index={0} tall aspect="aspect-[4/3]" />
            </div>
            <div className="grid gap-5 md:col-span-5">
              <FilmCard film={f2} index={1} aspect="aspect-[2/1]" />
              <FilmCard film={f3} index={2} aspect="aspect-[2/1]" />
            </div>
          </div>
        </div>
      </section>

      <section className="theme-dark border-y border-border bg-background py-24 text-foreground">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-accent">
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
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
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
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {l}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-5xl">Dispatch</h2>
          <Link
            to="/news"
            className="font-mono text-xs uppercase tracking-[0.25em] hover:text-neon-ink"
          >
            All news →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {news.slice(0, 3).map((n, i) => (
            <Reveal key={n.id} delay={i * 0.1}>
              <Link to="/news" className="group block">
                <div className="aspect-video overflow-hidden rounded-2xl">
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-neon-ink">
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
