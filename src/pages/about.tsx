import { Link } from "react-router";
import { heroImage } from "@/lib/films";
import { useFilms, useNews } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

export function AboutPage() {
  usePageMeta({
    title: "About — Fragrant Nature",
    description: "Fragrant Nature is an independent studio championing fearless filmmakers.",
  });

  const films = useFilms();
  const news = useNews();

  return (
    <>
      <PageTitle eyebrow="Est. 2014 — Brooklyn" title="Made for" outline="the dark" />
      <div className="relative mx-5 aspect-[16/9] min-h-[180px] overflow-hidden rounded-2xl sm:aspect-[21/9] md:mx-10">
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
            Fragrant Nature finds, finances and releases movies by filmmakers with something urgent
            to say. We back debuts as hard as we back legends.
          </p>
          <p>
            From midnight horror to festival-crowned drama, every release is built like an event —
            posters you want on your wall, trailers you watch twice, and theaters that stay full.
          </p>
        </Reveal>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <p className="mb-8 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
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
              <span className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                0{i + 1}
              </span>
              <span className="font-display text-3xl text-outline transition-all duration-500 group-hover:text-neon-ink sm:text-4xl md:text-6xl">
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

      {/* Subcategory: News & Dispatches Desk */}
      <section className="mx-auto max-w-[1600px] border-t border-border px-5 py-24 md:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
              About Subcategory
            </p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">News & Dispatches</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Official festival honors, theatrical acquisitions, and studio dispatches.
            </p>
          </div>
          <Link
            to="/news"
            className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink hover:underline"
          >
            All news dispatches ({news.length}) →
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {news.slice(0, 3).map((n, i) => (
            <Reveal key={n.id} delay={i * 0.08}>
              <Link to={`/news/${n.id}`} className="group block">
                <div className="aspect-video overflow-hidden rounded-2xl bg-black">
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
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
