import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";

import { useFilmBySlug, useFilms } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PlayButton, Reveal, TrailerModal } from "@/components/site";

function FilmNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <p className="font-display text-6xl">Cut!</p>
      <Link
        to="/films"
        className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink"
      >
        Back to movies
      </Link>
    </div>
  );
}

export function FilmPage() {
  const { slug } = useParams();
  const film = useFilmBySlug(slug);
  const films = useFilms();
  const [open, setOpen] = useState(false);

  usePageMeta(
    film
      ? { title: `${film.title} — Fragrant Nature`, description: film.synopsis }
      : { title: "Movie not found — Fragrant Nature" },
  );

  if (!film) return <FilmNotFound />;

  const more = films.filter((f) => f.slug !== film.slug).slice(0, 3);
  return (
    <>
      <section className="theme-dark relative h-[100svh] overflow-hidden bg-background text-foreground">
        <motion.img
          key={film.slug}
          src={film.poster}
          alt={film.title}
          fetchPriority="high"
          decoding="async"
          initial={{ scale: 1.3, filter: "blur(20px)" }}
          animate={{ scale: 1.05, filter: "blur(0px)" }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 scrim-b" />
        <div className="relative flex h-full flex-col justify-end px-5 pb-14 md:px-10">
          <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
            {film.genre} · {film.year} · {film.runtime} · {film.rating}
          </p>
          {(film.category || (film.subcategories?.length ?? 0) > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {film.category && (
                <Link
                  to={`/films?category=${encodeURIComponent(film.category.slug)}`}
                  className="rounded-full border border-white/40 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-white/85 backdrop-blur transition-colors hover:border-neon hover:text-neon"
                >
                  {film.category.name}
                </Link>
              )}
              {film.subcategories?.map((sub) => (
                <Link
                  key={sub._id}
                  to={`/films?subcategory=${encodeURIComponent(sub.slug)}`}
                  className="rounded-full border border-white/25 px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur transition-colors hover:border-neon hover:text-neon"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
          <h1 className="mt-4 overflow-hidden font-display text-[clamp(2.8rem,14vw,8rem)] text-white md:text-[clamp(4.5rem,10vw,10.5rem)] leading-[0.84]">
            <motion.span
              className="block"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {film.title}
            </motion.span>
          </h1>
          <p className="mt-2 text-xl italic text-white/75 md:text-2xl">"{film.tagline}"</p>
          <div className="mt-8 flex flex-wrap items-center gap-8">
            <PlayButton onClick={() => setOpen(true)} />
            <span className="rounded-full border border-neon-ink/50 bg-black/40 px-6 py-3 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink backdrop-blur">
              {film.release}
            </span>
          </div>
        </div>
      </section>
      <TrailerModal film={film} open={open} onClose={() => setOpen(false)} />

      <section className="mx-auto grid max-w-[1600px] gap-16 px-5 py-24 md:grid-cols-12 md:px-10">
        <Reveal className="md:col-span-7">
          <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
            Synopsis
          </p>
          <p className="mt-6 text-3xl leading-snug md:text-5xl">{film.synopsis}</p>
        </Reveal>
        <Reveal delay={0.1} className="space-y-8 md:col-span-4 md:col-start-9">
          {[
            ["Directed by", film.director],
            ["Starring", film.cast.join(", ")],
            ["Runtime", film.runtime],
            ["Rated", film.rating],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-border pb-4">
              <p className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 text-xl font-semibold">{v}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {film.laurels.map((l) => (
              <span
                key={l}
                className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-tight text-muted-foreground"
              >
                ✦ {l}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <h2 className="mb-10 font-display text-4xl md:text-6xl">
          More <span className="text-outline">to watch</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {more.map((f, i) => (
            <FilmCard key={f.slug} film={f} index={i} />
          ))}
        </div>
      </section>
    </>
  );
}
