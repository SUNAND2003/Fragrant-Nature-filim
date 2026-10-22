import { Link } from "react-router";

import { usePageMeta } from "@/lib/use-page-meta";

export function NotFoundPage() {
  usePageMeta({
    title: "Page not found — Fragrant Nature",
    description: "The page you're looking for doesn't exist or has been moved.",
  });

  return (
    <section className="theme-dark flex min-h-[100svh] items-center bg-background px-5 text-foreground md:px-10">
      <div className="mx-auto w-full max-w-[1600px]">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-ink">
          Error — cut from the reel
        </p>
        <h1 className="mt-6 font-display text-[clamp(4rem,20vw,18rem)] uppercase leading-[0.82]">
          Lost <span className="text-outline">frame</span>
        </h1>
        <p className="mt-8 max-w-md text-lg text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/"
            className="border border-foreground px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground"
          >
            Back to the studio
          </Link>
          <Link
            to="/films"
            className="border border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-foreground"
          >
            Browse movies
          </Link>
        </div>
      </div>
    </section>
  );
}
