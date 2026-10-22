import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";

import { films, getFilm } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PlayButton, Reveal, TrailerModal } from "@/components/site";

function FilmNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <p className="font-display text-6xl">Cut!</p>
      <Link to="/films" className="font-mono text-xs uppercase tracking-widest text-neon-ink">
        Back to movies
      </Link>
    </div>
  );
}

export function FilmPage() {
  const { slug } = useParams();
  const film = getFilm(slug ?? "");
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
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon">
            {film.genre} · {film.year} · {film.runtime} · {film.rating}
          </p>
          <h1 className="mt-4 overflow-hidden font-display text-[16vw] text-white md:text-[10vw]">
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
            <span className="border border-neon px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] text-neon">
              {film.release}
            </span>
          </div>
        </div>
      </section>
      <TrailerModal film={film} open={open} onClose={() => setOpen(false)} />

      <section className="mx-auto grid max-w-[1600px] gap-16 px-5 py-24 md:grid-cols-12 md:px-10">
        <Reveal className="md:col-span-7">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Synopsis</p>
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
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 text-xl font-semibold">{v}</p>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {film.laurels.map((l) => (
              <span
                key={l}
                className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest"
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
