import { Link } from "react-router";
import { useState } from "react";

import { useFilms } from "@/lib/content";
import type { Film } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, PlayButton, Reveal, ScreenRequestButton, TrailerModal } from "@/components/site";

export function UpcomingPage() {
  usePageMeta({
    title: "Upcoming Releases — Fragrant Nature",
    description: "The Fragrant Nature release slate: upcoming movies and trailers.",
  });

  const films = useFilms();
  const [film, setFilm] = useState<Film | null>(null);
  const list = films.filter((f) => f.status === "upcoming");
  return (
    <>
      <PageTitle eyebrow="2027 slate" title="Coming" outline="Soon" small />
      <div className="mx-auto max-w-[1600px] space-y-32 px-5 pb-24 md:px-10">
        {list.map((f, i) => (
          <div
            key={f.slug}
            className={`grid items-center justify-items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <Reveal>
              <div className="group relative aspect-[4/5] max-w-[480px] overflow-hidden rounded-2xl">
                <img
                  src={f.poster}
                  alt={f.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 rounded-full bg-neon-ink px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-tight text-white shadow-lg">
                  {f.release}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                {f.genre} — Dir. {f.director}
              </p>
              <h2 className="mt-4 font-display text-4xl md:text-5xl">{f.title}</h2>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">{f.synopsis}</p>
              <div className="mt-10 flex flex-wrap items-center gap-8">
                <PlayButton onClick={() => setFilm(f)} label="Teaser" />
                <ScreenRequestButton film={f} />
                <Link
                  to={`/films/${f.slug}`}
                  className="font-sans text-xs font-bold uppercase tracking-tight text-foreground underline-offset-8 transition-colors hover:text-neon-ink hover:underline"
                >
                  Details →
                </Link>
              </div>
            </Reveal>
          </div>
        ))}
      </div>
      {film && <TrailerModal film={film} open={!!film} onClose={() => setFilm(null)} />}
    </>
  );
}
