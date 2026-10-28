import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { LayoutGrid, Loader2, Pencil, PlugZap, Plus, Tags } from "lucide-react";

import { api, clearToken, getToken } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { Category, Subcategory } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "live" | "error";

/**
 * Public taxonomy index: every category with its subcategories nested inside.
 * Subcategories deep-link into the filtered catalog; when an admin session
 * exists the same card also offers create/edit shortcuts.
 *
 * This page pulls its own copy of the taxonomy straight from the API (rather
 * than only inheriting the app-wide snapshot) so it always reflects what the
 * admin panel holds right now, and reports loudly if the API can't be reached.
 */
export function CategoriesPage() {
  usePageMeta({
    title: "Categories — Fragrant Nature",
    description:
      "Browse the Fragrant Nature catalog by category and subcategory, and jump straight into the matching films.",
  });

  const { films, refresh: refreshShared } = useContent();
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken()));

  const [state, setState] = useState<LoadState>("loading");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = () => setReloadKey((key) => key + 1);

  // Fetch this page's taxonomy directly on every open (and on Retry), so a
  // failed app-wide load can never leave this page stuck on an empty list.
  //
  // Only `reloadKey` (Retry) and the stable `refreshShared` may retrigger this:
  // listing the fetched arrays themselves as deps would make each successful
  // refresh re-run the effect — an infinite fetch loop stuck on "loading".
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setError(null);

    Promise.all([
      api.get<Category[]>("/api/categories"),
      api.get<Subcategory[]>("/api/subcategories"),
    ])
      .then(([nextCategories, nextSubcategories]) => {
        if (cancelled) return;
        setCategories(nextCategories);
        setSubcategories(nextSubcategories);
        setState("live");
        // Keep the rest of the site's shared snapshot in step while we're here.
        void refreshShared();
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load categories");
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey, refreshShared]);

  // A stored token may be expired — confirm it once and drop it if the API says no.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    api
      .get<{ admin: { email: string } }>("/api/auth/me", { auth: true })
      .then(() => {
        if (!cancelled) setSignedIn(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const filmCount = (categorySlug: string) =>
    films.filter((film) => film.category?.slug === categorySlug).length;

  return (
    <>
      <PageTitle
        eyebrow={
          categories.length ? `${categories.length} groups in the catalog` : "Browse the slate"
        }
        title="The"
        outline="Categories"
      />

      <div className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        {signedIn && (
          <Reveal className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border border-neon/40 bg-neon/10 px-5 py-4">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-neon-ink">
                Admin mode — you can edit this taxonomy
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="rounded-none">
                  <Link to="/admin/categories">
                    <Plus /> New category
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="rounded-none">
                  <Link to="/admin/subcategories">
                    <Tags /> New subcategory
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        )}

        {state === "loading" ? (
          <div
            role="status"
            className="flex flex-col items-center gap-4 border border-dashed border-border px-6 py-16 text-center"
          >
            <Loader2 className="h-6 w-6 animate-spin text-neon-ink" />
            <p className="font-sans text-sm uppercase tracking-widest text-muted-foreground">
              Loading categories from the studio…
            </p>
          </div>
        ) : state === "error" ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-4 border border-destructive/50 bg-destructive/10 px-6 py-16 text-center"
          >
            <PlugZap className="h-8 w-8 text-destructive" />
            <p className="font-display text-3xl uppercase">Can’t reach the API</p>
            <p className="mx-auto max-w-lg font-sans text-sm text-foreground">{error}</p>
            <p className="mx-auto max-w-lg font-mono text-[11px] break-all text-muted-foreground">
              GET /api/categories · /api/subcategories — start the backend with{" "}
              <span className="text-neon-ink">npm run backend</span> (then{" "}
              <span className="text-neon-ink">npm run seed</span> once).
            </p>
            <Button type="button" className="rounded-none" onClick={retry}>
              Retry
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-dashed border-border px-6 py-16 text-center">
            <LayoutGrid className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-4 font-display text-3xl uppercase">No categories yet</p>
            <p className="mx-auto mt-3 max-w-lg font-sans text-sm text-muted-foreground">
              Categories and their subcategories are managed from the admin panel.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-none">
                <Link to={signedIn ? "/admin/categories" : "/films"}>
                  {signedIn ? "Create the first category" : "Browse all films"}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const subs = subcategories.filter((sub) => sub.category?._id === category._id);
              return (
                <motion.article
                  key={category._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: Math.min(index, 6) * 0.06 }}
                  className="flex flex-col border border-border bg-card"
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: category.accent || "#7CFF3D" }}
                  />

                  <div className="flex flex-1 flex-col gap-5 p-6">
                    <div>
                      <h2 className="font-display text-3xl uppercase leading-none md:text-4xl">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                      <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                        /{category.slug} · {filmCount(category.slug)} film(s) · {subs.length}{" "}
                        subcategory(s)
                      </p>
                    </div>

                    {/* Subcategories live inside their category card. */}
                    <div className="flex flex-1 flex-col gap-3">
                      <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-neon-ink">
                        Subcategories
                      </p>
                      {subs.length === 0 ? (
                        <p className="font-sans text-xs text-muted-foreground">None yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {subs.map((sub) => (
                            <Link
                              key={sub._id}
                              to={`/films?category=${encodeURIComponent(category.slug)}&subcategory=${encodeURIComponent(sub.slug)}`}
                              className={cn(
                                "rounded-full border border-border px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest",
                                "text-muted-foreground transition-colors hover:border-foreground hover:text-foreground",
                              )}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                      <Link
                        to={`/films?category=${encodeURIComponent(category.slug)}`}
                        className="font-sans text-xs font-bold uppercase tracking-tight hover:text-neon-ink"
                      >
                        All films →
                      </Link>

                      {signedIn && (
                        <span className="flex gap-2">
                          <Link
                            to={`/admin/categories?edit=${category._id}`}
                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </Link>
                          <Link
                            to={`/admin/subcategories?parent=${category._id}`}
                            className="flex items-center gap-1.5 border border-neon/50 bg-neon/10 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest text-neon-ink transition-colors hover:bg-neon hover:text-primary-foreground"
                          >
                            <Plus className="h-3 w-3" /> Subcategory
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
