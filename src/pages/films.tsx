import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { films } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { FilmCard, PageTitle } from "@/components/site";

export function FilmsPage() {
  usePageMeta({
    title: "Movies — Fragrant Nature",
    description: "Browse the full Fragrant Nature catalog of independent movies.",
  });

  const genres = ["All", ...Array.from(new Set(films.map((f) => f.genre)))];
  const [g, setG] = useState("All");
  const list = films.filter((f) => g === "All" || f.genre === g);
  return (
    <>
      <PageTitle eyebrow={`${films.length} titles`} title="The" outline="Catalog" />
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="mb-10 flex flex-wrap gap-2">
          {genres.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setG(x)}
              aria-pressed={g === x}
              className={`border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${g === x ? "border-neon bg-neon text-primary-foreground" : "border-border hover:border-foreground"}`}
            >
              {x}
            </button>
          ))}
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
      </div>
    </>
  );
}
