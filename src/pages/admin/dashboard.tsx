import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Camera, Film, Folder, Menu as MenuIcon, Newspaper, Plus, Trophy } from "lucide-react";

import { api } from "@/lib/api";
import { useContent } from "@/lib/content";
import type { Film as FilmDoc } from "@/lib/films";
import { useAdminAuth } from "@/pages/admin/auth";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/pages/admin/ui";

type Health = { db: "up" | "down"; uploads: "cloudinary" | "local" };

/** The API returns timestamps the bundled `Film` type doesn't declare. */
type FilmRecord = FilmDoc & { createdAt?: string; updatedAt?: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Edited …" / "Added …"; null for the bundled catalogue, which has no timestamps. */
const modifiedLabel = (film: FilmRecord) => {
  if (film.updatedAt) return `Edited ${formatDate(film.updatedAt)}`;
  if (film.createdAt) return `Added ${formatDate(film.createdAt)}`;
  return null;
};

function SystemRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string | undefined;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3 last:border-b-0">
      <span className="font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`font-sans text-sm ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

export function DashboardSection() {
  const { films, categories, subcategories, news, awards, navigation, gallery, source } =
    useContent();
  const { admin } = useAdminAuth();
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    // A dead server is already reported by the System panel — no toast.
    void api
      .get<Health>("/api/health")
      .then(setHealth)
      .catch(() => undefined);
  }, []);

  const stats = [
    { label: "Films", value: films.length, to: "/admin/films", icon: Film },
    { label: "Categories", value: categories.length, to: "/admin/categories", icon: Folder },
    { label: "Gallery sets", value: gallery.length, to: "/admin/gallery", icon: Camera },
    { label: "News articles", value: news.length, to: "/admin/news", icon: Newspaper },
    { label: "Menu items", value: navigation.length, to: "/admin/navigation", icon: MenuIcon },
    { label: "Honors", value: awards.length, to: "/admin/awards", icon: Trophy },
  ];

  const glance = [
    { label: "In theaters", value: films.filter((film) => film.status === "now").length },
    { label: "Upcoming", value: films.filter((film) => film.status === "upcoming").length },
    { label: "Featured", value: films.filter((film) => film.featured).length },
  ];

  // Newest first by edit/add stamp; the bundled catalogue has none, so it keeps its order.
  const recent = [...(films as FilmRecord[])]
    .sort(
      (a, b) =>
        (b.updatedAt ?? b.createdAt ?? "").localeCompare(a.updatedAt ?? a.createdAt ?? "") ||
        (a.order ?? 0) - (b.order ?? 0),
    )
    .slice(0, 5);

  const apiTone = health && health.db === "up" ? "text-neon-ink" : "text-destructive";

  return (
    <>
      <PageHead
        title="Dashboard"
        description="Catalogue counts, the last films touched, and the state of the API behind this panel."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" asChild className="rounded-none bg-neutral-900 text-white hover:bg-neutral-800">
              <Link to="/admin/films">
                <Plus className="h-4 w-4" /> New film
              </Link>
            </Button>
            <Button type="button" variant="outline" asChild className="rounded-none border-neutral-300 text-neutral-800 hover:bg-neutral-100">
              <Link to="/admin/categories?create=true">
                <Plus className="h-4 w-4" /> New category
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.to}
              className="group flex items-center justify-between gap-4 border border-border bg-card p-5 transition-colors hover:border-neon-ink"
            >
              <div>
                <p className="font-display text-4xl leading-none">{stat.value}</p>
                <p className="mt-3 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </p>
              </div>
              <Icon className="h-6 w-6 shrink-0 text-muted-foreground transition-colors group-hover:text-neon-ink" />
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="border border-border bg-card p-5">
          <h2 className="font-display text-xl uppercase">Catalogue at a glance</h2>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {glance.map((item) => (
              <div
                key={item.label}
                className="border border-border bg-background px-3 py-3 text-center"
              >
                <p className="font-display text-2xl leading-none">{item.value}</p>
                <p className="mt-2 font-sans text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Recently added or edited
          </p>
          {recent.length === 0 ? (
            <p className="mt-2 font-sans text-sm text-muted-foreground">
              No films yet — create the first one from the New film button above.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {recent.map((film) => {
                const modified = modifiedLabel(film);
                return (
                  <li key={film.slug}>
                    <Link
                      to="/admin/films"
                      className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:text-neon-ink"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-sm font-bold uppercase tracking-tight">
                          {film.title}
                        </span>
                        <span className="block font-mono text-[11px] text-muted-foreground">
                          {film.status === "now" ? "In theaters" : "Upcoming"}
                          {modified ? ` · ${modified}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        /{film.slug}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border border-border bg-card p-5">
          <h2 className="font-display text-xl uppercase">System</h2>

          <div className="mt-2">
            <SystemRow
              label="API"
              value={health ? (health.db === "up" ? "Connected" : "Database down") : "Unreachable"}
              tone={apiTone}
            />
            <SystemRow
              label="Uploads"
              value={health ? (health.uploads === "cloudinary" ? "Cloudinary" : "Local disk") : "—"}
            />
            <SystemRow
              label="Content source"
              value={
                source === "live"
                  ? "Live — reading from the API"
                  : source === "static"
                    ? "Bundled fallback"
                    : "Checking…"
              }
              tone={source === "static" ? "text-destructive" : undefined}
            />
            <SystemRow label="Signed in" value={admin ? admin.email : "—"} />
          </div>

          {source === "static" && (
            <p className="mt-4 border border-destructive/50 bg-destructive/10 px-3 py-2 font-sans text-xs text-foreground">
              The site is rendering the bundled catalogue instead of live data. Start the API with{" "}
              <code className="text-neon-ink">npm run backend</code> (and run{" "}
              <code className="text-neon-ink">npm run seed</code> once) to go live.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
