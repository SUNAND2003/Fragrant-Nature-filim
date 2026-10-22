import { films, heroImage } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

export function AboutPage() {
  usePageMeta({
    title: "About — Lumen Pictures",
    description: "Lumen Pictures is an independent studio championing fearless filmmakers.",
  });

  return (
    <>
      <PageTitle eyebrow="Est. 2014 — Brooklyn" title="Made for" outline="the dark" />
      <div className="relative mx-5 aspect-[21/9] overflow-hidden rounded-2xl md:mx-10">
        <img src={heroImage} alt="" className="kenburns h-full w-full object-cover" />
      </div>
      <section className="mx-auto grid max-w-[1600px] gap-16 px-5 py-24 md:grid-cols-2 md:px-10">
        <Reveal>
          <p className="font-display text-3xl md:text-5xl">
            Independent. Uncompromising. <span className="text-neon-ink">Loud.</span>
          </p>
        </Reveal>
        <Reveal delay={0.1} className="space-y-6 text-lg text-muted-foreground">
          <p>
            Lumen Pictures finds, finances and releases films by filmmakers with something urgent to
            say. We back debuts as hard as we back legends.
          </p>
          <p>
            From midnight horror to festival-crowned drama, every release is built like an event —
            posters you want on your wall, trailers you watch twice, and theaters that stay full.
          </p>
        </Reveal>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.3em] text-accent">
          What we believe
        </p>
        {[
          "Cinema is a communal act",
          "Taste over trends",
          "Risk is the point",
          "Directors first",
        ].map((t, i) => (
          <Reveal key={t} delay={i * 0.05}>
            <div className="group flex items-baseline gap-6 border-b border-border py-6">
              <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
              <span className="font-display text-4xl text-outline transition-all duration-500 group-hover:text-neon-ink md:text-6xl">
                {t}
              </span>
            </div>
          </Reveal>
        ))}
        <div className="mt-24 grid grid-cols-3 gap-2 md:grid-cols-7">
          {films.map((f) => (
            <img
              key={f.slug}
              src={f.poster}
              alt={f.title}
              loading="lazy"
              className="aspect-[2/3] w-full rounded-2xl object-cover grayscale transition-all duration-500 hover:-translate-y-3 hover:grayscale-0"
            />
          ))}
        </div>
      </section>
    </>
  );
}
