import { Link } from "react-router";
import { useMemo, useState } from "react";

import { useFilms } from "@/lib/content";
import type { Film } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, PlayButton, Reveal, ScreenRequestButton, SmartRailImage, TrailerModal } from "@/components/site";

export function UpcomingPage() {
  usePageMeta({
    title: "Upcoming Releases — Fragrant Nature",
    description: "The Fragrant Nature release slate: upcoming movies and trailers.",
  });

  const films = useFilms();
  const [film, setFilm] = useState<Film | null>(null);

  // Live upcoming slate: includes any film with a Coming Soon showcase poster
  // (Slot 2 in Admin) or marked upcoming, with active showcase posters at the top.
  // Keeps the top 3 active titles; older ones drop off as new posters are added.
  const list = useMemo(() => {
    return films
      .filter((f) => Boolean(f.comingSoonBanner) || f.status === "upcoming")
      .sort((a, b) => {
        if (Boolean(a.comingSoonBanner) !== Boolean(b.comingSoonBanner)) {
          return a.comingSoonBanner ? -1 : 1;
        }
        return 0;
      })
      .slice(0, 3);
  }, [films]);

  return (
    <>
      <PageTitle eyebrow="Release Slate" title="Coming" outline="Soon" small />
      <div className="mx-auto max-w-[1600px] space-y-32 px-5 pb-24 md:px-10">
        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl uppercase tracking-wider text-muted-foreground">
              No upcoming releases scheduled yet
            </p>
          </div>
        ) : (
          list.map((f, i) => (
            <div
              key={f.slug}
              className={`grid items-center justify-items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <Reveal className="w-full max-w-[480px]">
                <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-950 flex items-center justify-center">
                  <SmartRailImage
                    src={f.comingSoonBanner || f.poster || f.banner || f.still || ""}
                    alt={f.title}
                    loading={i === 0 ? "eager" : "lazy"}
                    orientation="portrait"
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-neon-ink px-3.5 py-1.5 font-sans text-[11px] font-bold uppercase tracking-tight text-white shadow-lg z-10">
                    {f.release || "Coming Soon"}
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
          ))
        )}
      </div>
      {film && <TrailerModal film={film} open={!!film} onClose={() => setFilm(null)} />}
    </>
  );
}
