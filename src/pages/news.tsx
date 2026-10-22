import { news } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

export function NewsPage() {
  usePageMeta({
    title: "News — Lumen Pictures",
    description: "Awards, trailers, interviews and studio news from Lumen Pictures.",
  });

  const lead = news[0]!;
  const rest = news.slice(1);
  return (
    <>
      <PageTitle eyebrow="Dispatch" title="News" />
      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <Reveal>
          <article className="group grid cursor-pointer gap-8 border-y border-border py-10 md:grid-cols-2">
            <div className="aspect-video overflow-hidden rounded-2xl">
              <img
                src={lead.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-neon-ink">
                {lead.tag} — {lead.date}
              </p>
              <h2 className="mt-4 font-display text-4xl md:text-6xl">{lead.title}</h2>
              <p className="mt-6 text-lg text-muted-foreground">{lead.excerpt}</p>
            </div>
          </article>
        </Reveal>
        {rest.map((n, i) => (
          <Reveal key={n.id} delay={i * 0.05}>
            <article className="group relative grid cursor-pointer items-center gap-6 overflow-hidden border-b border-border py-8 md:grid-cols-12">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground md:col-span-2">
                {n.date}
              </p>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent md:col-span-2">
                {n.tag}
              </p>
              <h3 className="text-3xl font-bold transition-transform duration-500 group-hover:translate-x-4 group-hover:text-neon-ink md:col-span-6 md:text-4xl">
                {n.title}
              </h3>
              <img
                src={n.image}
                alt=""
                loading="lazy"
                className="pointer-events-none hidden h-28 w-20 rotate-6 object-cover opacity-0 transition-all duration-500 group-hover:rotate-0 group-hover:opacity-100 md:col-span-2 md:block md:justify-self-end"
              />
            </article>
          </Reveal>
        ))}
      </div>
    </>
  );
}
