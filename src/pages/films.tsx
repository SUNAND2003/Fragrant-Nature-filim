import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";

import { useCategories, useFilms, useSubcategories } from "@/lib/content";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PageTitle } from "@/components/site";

type Facet = { slug: string; name: string };

export function FilmsPage() {
  usePageMeta({
    title: "Movies — Fragrant Nature",
    description: "Browse the full Fragrant Nature catalog of independent movies.",
  });

  const films = useFilms();
  const categories = useCategories();
  const subcategories = useSubcategories();
  const [genre, setGenre] = useState("All");

  // Category/subcategory live in the URL so film pages can deep-link into a
  // facet (`/films?category=feature-films&subcategory=horror`).
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "all";
  const subcategory = params.get("subcategory") ?? "all";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all" || value === "All") next.delete(key);
    else next.set(key, value);
    if (key === "category") next.delete("subcategory");
    setParams(next, { replace: true });
  };

  // The admin's taxonomy drives the filters when the API is up; the bundled
  // catalogue (no categories) falls back to plain genre chips.
  const useTaxonomy = categories.length > 0;

  const genreFacets: Facet[] = useMemo(
    () => Array.from(new Set(films.map((f) => f.genre))).map((name) => ({ slug: name, name })),
    [films],
  );

  const subFacets: Facet[] = useMemo(() => {
    if (useTaxonomy) {
      const scoped =
        category === "all"
          ? subcategories
          : subcategories.filter((s) => s.category?.slug === category);
      return scoped.map((s) => ({ slug: s.slug, name: s.name }));
    }
    return genreFacets;
  }, [useTaxonomy, category, subcategories, genreFacets]);

  const list = useMemo(() => {
    return films.filter((f) => {
      if (useTaxonomy) {
        if (category !== "all" && f.category?.slug !== category) return false;
        if (subcategory !== "all" && !f.subcategories?.some((s) => s.slug === subcategory))
          return false;
        return true;
      }
      return genre === "All" || f.genre === genre;
    });
  }, [films, useTaxonomy, category, subcategory, genre]);

  const facetChips: Facet[] = useTaxonomy
    ? [{ slug: "all", name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))]
    : [{ slug: "All", name: "All" }, ...genreFacets];

  const activeSub = useTaxonomy ? subcategory : genre;

  return (
    <>
      <PageTitle eyebrow={`${list.length} titles`} title="The" outline="Catalog" />
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="space-y-4 pb-10">
          <div className="flex flex-wrap gap-2">
            {facetChips.map((chip) => {
              const active = useTaxonomy ? category === chip.slug : genre === chip.name;
              return (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() =>
                    useTaxonomy ? setParam("category", chip.slug) : setGenre(chip.name)
                  }
                  aria-pressed={active}
                  className={`rounded-full border px-5 py-2 font-sans text-xs font-bold uppercase tracking-tight transition-colors ${
                    active
                      ? "border-neon bg-neon text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {chip.name}
                </button>
              );
            })}
          </div>

          {subFacets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => (useTaxonomy ? setParam("subcategory", "all") : setGenre("All"))}
                aria-pressed={activeSub === (useTaxonomy ? "all" : "All")}
                className={`rounded-full border border-dashed px-4 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  activeSub === (useTaxonomy ? "all" : "All")
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                All {useTaxonomy ? "subcategories" : "genres"}
              </button>
              {subFacets.map((facet) => (
                <button
                  key={facet.slug}
                  type="button"
                  onClick={() =>
                    useTaxonomy ? setParam("subcategory", facet.slug) : setGenre(facet.slug)
                  }
                  aria-pressed={activeSub === facet.slug}
                  className={`rounded-full border px-4 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    activeSub === facet.slug
                      ? "border-neon-ink text-neon-ink"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {facet.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div
          layout
          className="grid gap-5 pb-24 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {list.map((f, i) => (
              <motion.div
                key={f.slug}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <FilmCard film={f} index={i} aspect="aspect-[4/5]" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {list.length === 0 && (
          <p className="-mt-8 pb-24 font-sans text-sm uppercase tracking-widest text-muted-foreground">
            Nothing filed under this filter yet.
          </p>
        )}
      </div>
    </>
  );
}
