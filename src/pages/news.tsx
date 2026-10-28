import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useNews } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";

export function NewsPage() {
  usePageMeta({
    title: "News — Fragrant Nature",
    description: "Awards, trailers, interviews and studio news from Fragrant Nature.",
  });

  const news = useNews();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return undefined;
    }
    const el = document.getElementById(hash.replace("#", ""));
    if (!el) return undefined;
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    return () => clearTimeout(timer);
  }, [hash]);

  const lead = news[0]!;
  const rest = news.slice(1);
  return (
    <>
      <PageTitle eyebrow="Dispatch" title="News" />
      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <Reveal>
          <Link
            to={`/news/${lead.id}`}
            id={`news-${lead.id}`}
            className={`group grid scroll-mt-28 gap-8 border-y border-border py-10 transition-all duration-700 md:grid-cols-2 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] cursor-pointer ${
              hash === `#news-${lead.id}`
                ? "rounded-2xl bg-neon-ink/5 p-4 ring-1 ring-neon-ink/50"
                : ""
            }`}
          >
            <div className="aspect-video overflow-hidden rounded-2xl">
              <img
                src={lead.image}
                alt={lead.title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                {lead.tag} — {lead.date}
              </p>
              <h2 className="mt-4 font-display text-4xl transition-colors duration-300 group-hover:text-neon-ink md:text-6xl">
                {lead.title}
              </h2>
              <p className="mt-6 text-lg text-muted-foreground">{lead.excerpt}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-neon-ink">
                Read story →
              </span>
            </div>
          </Link>
        </Reveal>
        {rest.map((n, i) => (
          <Reveal key={n.id} delay={i * 0.05}>
            <Link
              to={`/news/${n.id}`}
              id={`news-${n.id}`}
              className={`group relative grid scroll-mt-28 items-center gap-3 sm:gap-6 overflow-hidden border-b border-border py-6 sm:py-8 transition-all duration-700 md:grid-cols-12 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] cursor-pointer ${
                hash === `#news-${n.id}`
                  ? "rounded-2xl bg-neon-ink/5 px-4 ring-1 ring-neon-ink/50"
                  : ""
              }`}
            >
              <p className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground md:col-span-2">
                {n.date}
              </p>
              <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink md:col-span-2">
                {n.tag}
              </p>
              <h3 className="text-2xl font-bold uppercase tracking-tight transition-transform duration-500 group-hover:translate-x-4 group-hover:text-neon-ink md:col-span-6 md:text-3xl">
                {n.title}
              </h3>
              <div className="hidden md:col-span-2 md:block md:justify-self-end">
                <img
                  src={n.image}
                  alt={n.title}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none h-28 w-20 rotate-6 object-cover opacity-0 transition-all duration-500 group-hover:rotate-0 group-hover:opacity-100"
                />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
