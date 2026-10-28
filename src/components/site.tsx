import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import logo from "@/assets/icon.png";
import { useLikes } from "@/lib/likes";
import type { Film } from "@/lib/films";
import { useFilmLookup, useNavigation, useSettings } from "@/lib/content";
import { buildNavItems, type MenuSubcategory, type NavMenuItem } from "@/lib/navigation";

export type Subcategory = MenuSubcategory;
export type NavItem = NavMenuItem;

/**
 * The public menu, live from the admin panel (`/admin/navigation`), with the
 * About → News dropdown attached to whichever entry still points at /about.
 */
function useNav(): readonly NavItem[] {
  const entries = useNavigation();
  return useMemo(() => buildNavItems(entries), [entries]);
}

// Swap these URLs for the studio's real profile links.
const socials = [
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
] as const;

/**
 * Social links with hrefs taken from the admin's site settings (keys match the
 * lowercased label: `youtube`, `instagram`, `facebook`). Placeholder values fall
 * back to the defaults above.
 */
function useSocials() {
  const settings = useSettings();
  return socials.map((social) => {
    const configured = settings[social.label.toLowerCase()];
    return { ...social, href: configured && configured !== "#" ? configured : social.href };
  });
}

/** Left-hand arrow that slides in when a menu item is hovered. */
function MenuArrow() {
  return (
    <span className="pointer-events-none absolute -left-8 top-1/2 -translate-x-3 -translate-y-1/2 text-neon-ink opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:opacity-100 md:-left-12">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[0.55em] w-[0.55em]"
        aria-hidden
      >
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  const getFilm = useFilmLookup();
  const socialLinks = useSocials();
  const nav = useNav();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Live like indicator: mirrors the shared likes store, so it fills and
  // counts up the moment a film is hearted anywhere (e.g. the hero button).
  const { likes, toggle, clear } = useLikes();
  const likedCount = likes.length;
  const [likesOpen, setLikesOpen] = useState(false);
  const likedFilms = likes.map((slug) => getFilm(slug)).filter((f): f is Film => Boolean(f));
  const { pathname } = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  // The likes panel and subnav dropdowns close on Escape and whenever the route changes.
  useEffect(() => {
    setLikesOpen(false);
    setOpenDropdowns({});
  }, [pathname, open]);
  useEffect(() => {
    const hasAnyDropdown = Object.values(openDropdowns).some(Boolean);
    if (!likesOpen && !hasAnyDropdown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLikesOpen(false);
        setOpenDropdowns({});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [likesOpen, openDropdowns]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);
  // Transparent while at rest on the dark hero stages (and while the menu is
  // shut), solid black the moment you scroll or open the menu — and solid
  // black from the start on the light pages, where the white logo/nav would
  // otherwise sit on white content.
  const overHero = !scrolled && !open && (pathname === "/" || /^\/films\/[^/]+$/.test(pathname));
  return (
    <header
      className={`theme-dark fixed inset-x-0 top-0 z-50 text-foreground pt-[env(safe-area-inset-top)] transition-colors duration-500 ${overHero ? "bg-transparent" : "bg-black"}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-neon focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-4 py-1.5 sm:px-5 md:px-10 md:py-2">
        <div className="col-start-1" aria-hidden />
        <Link
          to="/"
          className="col-start-2 flex items-center justify-self-center"
          aria-label="Fragrant Nature — home"
        >
          <img src={logo} alt="Fragrant Nature Film Productions" className="w-32 sm:w-40 md:w-56" />
        </Link>
        <div className="col-start-3 flex items-center justify-self-end gap-1">
          <button
            type="button"
            onClick={() => setLikesOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={likesOpen}
            aria-label={
              likedCount
                ? `Show ${likedCount} liked movie${likedCount > 1 ? "s" : ""}`
                : "Liked movies"
            }
            className={`relative p-2.5 transition-colors hover:text-neon-ink ${likedCount ? "text-neon-ink" : ""}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={likedCount ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 md:h-6 md:w-6"
              aria-hidden
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likedCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 font-mono text-[9px] font-bold leading-none text-primary-foreground">
                {likedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 transition-colors hover:text-neon-ink"
            aria-label="Menu"
            aria-expanded={open}
          >
            <span className="relative block h-4 w-8" aria-hidden>
              <span
                className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-300 ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 top-1/2 block h-0.5 w-full -translate-y-1/2 bg-current transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-full bg-current transition-all duration-300 ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"}`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Liked list — opens under the header heart. */}
      <AnimatePresence>
        {likesOpen && (
          <>
            <button
              type="button"
              aria-label="Close liked movies"
              onClick={() => setLikesOpen(false)}
              className="fixed inset-0 z-40 cursor-default bg-black/60"
            />
            <motion.div
              role="dialog"
              aria-label="Liked movies"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="theme-dark absolute right-4 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-black shadow-2xl md:right-10"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                  Liked {likedCount > 0 ? `· ${likedCount}` : ""}
                </p>
                {likedCount > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {likedCount === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="font-display text-2xl">Nothing liked yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tap the heart on a film to keep it here.
                  </p>
                </div>
              ) : (
                <ul className="max-h-[60vh] overflow-y-auto">
                  {likedFilms.map((f) => (
                    <li
                      key={f.slug}
                      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                    >
                      <Link
                        to={`/films/${f.slug}`}
                        onClick={() => setLikesOpen(false)}
                        className="flex flex-1 items-center gap-3 transition-colors hover:text-neon-ink"
                      >
                        <img
                          src={f.poster}
                          alt=""
                          loading="lazy"
                          className="h-16 w-11 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-display text-lg">{f.title}</span>
                          <span className="block font-sans text-[11px] font-semibold uppercase tracking-tight text-muted-foreground">
                            {f.genre} · {f.year}
                          </span>
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggle(f.slug)}
                        aria-label={`Unlike ${f.title}`}
                        className="shrink-0 p-2 text-neon-ink transition-colors hover:text-foreground"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4"
                          aria-hidden
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="theme-dark absolute inset-x-0 top-full flex h-[calc(100dvh-100%)] flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-black px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8"
          >
            <div className="my-auto flex w-full max-w-2xl flex-col items-center justify-center gap-3 py-4 sm:gap-4 md:gap-5 md:py-6">
              {nav.map((n, i) => {
                const hasSub =
                  "subcategories" in n && Boolean(n.subcategories && n.subcategories.length > 0);
                return (
                  <motion.div
                    key={n.to}
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.05 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative flex items-center justify-center">
                      <Link
                        to={n.to}
                        onClick={() => setOpen(false)}
                        aria-current={pathname === n.to ? "page" : undefined}
                        className="group/link relative block text-center font-display text-3xl tracking-wider hover:text-neon-ink sm:text-4xl md:text-5xl lg:text-6xl md:tracking-[0.06em]"
                      >
                        <span className="inline-block transition-transform duration-300 ease-out group-hover/link:translate-x-2.5 md:group-hover/link:translate-x-4">
                          {n.label}
                        </span>
                        <MenuArrow />
                      </Link>

                      {hasSub && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdowns((prev) => ({ ...prev, [n.to]: !prev[n.to] }))
                          }
                          aria-expanded={Boolean(openDropdowns[n.to])}
                          aria-label={`Toggle ${n.to === "/about" ? "News" : n.label} subcategory dropdown`}
                          className={`absolute left-[calc(100%+0.625rem)] top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 sm:left-[calc(100%+0.75rem)] sm:h-8 sm:w-8 md:left-[calc(100%+1rem)] md:h-9 md:w-9 ${
                            openDropdowns[n.to]
                              ? "rotate-180 border-neon bg-neon text-primary-foreground shadow-lg shadow-neon/30"
                              : "border-white/30 text-white/80 hover:border-neon hover:text-neon-ink"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Dynamic Subnav dropdown: renders all subcategories for this item */}
                    <AnimatePresence>
                      {hasSub && openDropdowns[n.to] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="mt-2 flex flex-col items-center gap-2 overflow-hidden sm:mt-2.5"
                        >
                          {n.subcategories?.map((sub) => (
                            <Link
                              key={sub.to + sub.label}
                              to={sub.to}
                              onClick={() => {
                                setOpen(false);
                                setOpenDropdowns({});
                              }}
                              className="group/sub inline-flex items-center gap-2 rounded-full border border-neon/50 bg-neon/10 px-4 py-1.5 font-display text-xl tracking-wider text-neon-ink transition-all duration-300 hover:bg-neon hover:text-primary-foreground sm:gap-2.5 sm:px-5 sm:py-2 sm:text-2xl md:text-3xl"
                            >
                              <span className="inline-block transition-transform duration-300 ease-out group-hover/sub:translate-x-0.5">
                                {sub.label}
                              </span>
                              <span className="text-base leading-none sm:text-lg">→</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Socials sit below the menu */}
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + nav.length * 0.05 }}
                className="mt-4 flex items-center gap-3 sm:mt-6 sm:gap-4 md:mt-8"
              >
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground sm:h-10 sm:w-10"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                      aria-hidden
                    >
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  const settings = useSettings();
  const socialLinks = useSocials();
  const nav = useNav();
  const [footerAboutDropdownOpen, setFooterAboutDropdownOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="theme-dark relative border-t border-border/80 bg-background text-foreground">
      {/* Top Cinema Marquee Ribbon */}
      <div className="relative overflow-hidden border-b border-border/60 bg-black/60 py-4.5 backdrop-blur-sm">
        <div className="marquee flex w-max gap-8 whitespace-nowrap font-display text-2xl tracking-[0.04em] uppercase sm:text-3xl md:text-4xl text-foreground/90">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex items-center gap-8">
              <span>Stories Worth The Dark</span>
              <span className="text-neon-ink text-sm sm:text-base">✦</span>
              <span className="text-outline">Cinema Without Compromise</span>
              <span className="text-accent text-sm sm:text-base">✦</span>
              <span>Independent & Loud</span>
              <span className="text-neon-ink text-sm sm:text-base">✦</span>
              <span className="text-outline">Cannes · Sundance · Venice</span>
              <span className="text-accent text-sm sm:text-base">✦</span>
              <span>See It Big</span>
              <span className="text-neon-ink text-sm sm:text-base">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="relative mx-auto max-w-[1600px] px-5 py-16 md:px-10 lg:py-20">
        {/* Subtle ambient spotlight */}
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-72 w-full max-w-4xl bg-gradient-to-b from-neon/[0.04] via-transparent to-transparent blur-3xl" />

        <div className="relative grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Col 1: Studio Brand & Identity (lg:col-span-4) */}
          <div className="space-y-6 sm:col-span-2 lg:col-span-4">
            <Link
              to="/"
              className="inline-block transition-transform duration-300 hover:scale-[1.02]"
            >
              <img
                src={logo}
                alt="Fragrant Nature Film Creations"
                className="w-56 sm:w-64 md:w-72"
              />
            </Link>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              An independent film studio championing fearless directors, original visions, and
              unforgettable theatrical experiences built for the dark.
            </p>

            {/* Studio Hubs Status Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-border/80 bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-neon" />
              </span>
              <span className="font-sans text-[11px] font-bold uppercase tracking-tight text-foreground/90">
                {(settings.address || "Brooklyn · London · Kochi")
                  .split("·")
                  .map((part, i, parts) => (
                    <span key={part}>
                      {part.trim()}
                      {i < parts.length - 1 && <span className="text-neon-ink"> · </span>}
                    </span>
                  ))}
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-white/[0.02] text-muted-foreground transition-all duration-300 hover:border-neon hover:bg-neon hover:text-primary-foreground hover:shadow-lg hover:shadow-neon/20"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden
                  >
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 2: Slate Navigation (lg:col-span-3) */}
          <div className="lg:col-span-3">
            <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neon-ink">
              Cinema Slate
            </p>
            <h4 className="mt-1 font-display text-xl uppercase tracking-wide text-foreground">
              Navigation
            </h4>

            <div className="mt-5 space-y-3 font-sans text-xs font-bold uppercase tracking-tight">
              {nav.map((n) => {
                const hasSub =
                  "subcategories" in n && Boolean(n.subcategories && n.subcategories.length > 0);
                return (
                  <div key={n.to} className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={n.to}
                        className="group inline-flex items-center gap-1.5 transition-colors hover:text-neon-ink"
                      >
                        <span className="text-muted-foreground/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-neon-ink">
                          /
                        </span>
                        <span className="transition-transform duration-300 group-hover:translate-x-1">
                          {n.label}
                        </span>
                      </Link>

                      {hasSub && (
                        <button
                          type="button"
                          onClick={() => setFooterAboutDropdownOpen((o) => !o)}
                          aria-expanded={footerAboutDropdownOpen}
                          aria-label="Toggle footer News dropdown"
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-300 ${
                            footerAboutDropdownOpen
                              ? "rotate-180 border-neon bg-neon text-primary-foreground shadow-sm shadow-neon/30"
                              : "border-white/30 text-white/80 hover:border-neon hover:text-neon-ink"
                          }`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Dropdown: dynamic subcategory pills */}
                    <AnimatePresence>
                      {hasSub && footerAboutDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -4 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="my-1.5 flex flex-col items-start gap-1.5 overflow-hidden pl-3"
                        >
                          {(n.subcategories ?? []).map((sub) => (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className="group/news inline-flex items-center gap-2.5 rounded-full border border-neon/50 bg-neon/10 px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink transition-all duration-300 hover:bg-neon hover:text-primary-foreground hover:shadow-md hover:shadow-neon/20"
                            >
                              <span className="inline-block transition-transform duration-300 ease-out group-hover/news:translate-x-1">
                                {sub.label}
                              </span>
                              <span className="text-sm leading-none">→</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Col 3: Direct Department Contacts (lg:col-span-2) */}
          <div className="space-y-4 lg:col-span-2">
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neon-ink">
                Direct Lines
              </p>
              <h4 className="mt-1 font-display text-xl uppercase tracking-wide text-foreground">
                Inquiries
              </h4>
            </div>

            <div className="space-y-3.5 text-xs text-muted-foreground">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-tight text-foreground/80">
                  Studio & Development
                </p>
                <a
                  href={`mailto:${settings.email || "hello@fragrantnaturefilms.com"}`}
                  className="mt-0.5 block font-mono text-[11px] transition-colors hover:text-neon-ink"
                >
                  {settings.email || "hello@fragrantnaturefilms.com"}
                </a>
              </div>

              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-tight text-foreground/80">
                  Press & Festivals
                </p>
                <a
                  href="mailto:press@fragrantnaturefilms.com"
                  className="mt-0.5 block font-mono text-[11px] transition-colors hover:text-neon-ink"
                >
                  press@fragrantnaturefilms.com
                </a>
              </div>

              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-tight text-foreground/80">
                  Theatrical & DCP
                </p>
                <a
                  href="mailto:distribution@fragrantnaturefilms.com"
                  className="mt-0.5 block font-mono text-[11px] transition-colors hover:text-neon-ink"
                >
                  distribution@fragrantnaturefilms.com
                </a>
              </div>

              <div className="pt-2">
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink hover:underline"
                >
                  <span>Full Directory</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Col 4: Newsletter / The Dispatch (lg:col-span-3) */}
          <div className="space-y-4 lg:col-span-3">
            <div>
              <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-neon-ink">
                Screening Wire
              </p>
              <h4 className="mt-1 font-display text-xl uppercase tracking-wide text-foreground">
                The Dispatch
              </h4>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Secret advance screenings, festival premiere tickets, 35mm prints, and director
              dispatches delivered direct.
            </p>

            {newsletterSubmitted ? (
              <div className="rounded-2xl border border-neon/40 bg-neon/10 p-4 text-xs">
                <p className="font-sans font-bold uppercase tracking-tight text-neon-ink">
                  ✦ You're On The List
                </p>
                <p className="mt-1 text-foreground/80">
                  We’ve reserved your screening updates. Look for our first dispatch soon.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail.trim()) setNewsletterSubmitted(true);
                }}
                className="space-y-3"
              >
                <div className="relative flex items-center rounded-xl border border-border/80 bg-black/40 transition-colors focus-within:border-neon focus-within:ring-1 focus-within:ring-neon/40">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    aria-label="Email address"
                    autoComplete="email"
                    placeholder="your@email.com"
                    className="w-full bg-transparent px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="mr-1.5 shrink-0 rounded-lg bg-neon px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-tight text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-sm hover:shadow-neon/30"
                  >
                    Join →
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/75">
                  Zero noise · Direct invitations · Unsubscribe anytime
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/40 bg-black/40 px-5 py-6 md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="font-sans text-[11px] font-medium uppercase tracking-tight text-muted-foreground">
              © {new Date().getFullYear()} {settings.siteName || "Fragrant Nature Film Productions"}
              .
            </p>
            <span className="hidden text-muted-foreground/40 sm:inline">·</span>
            <p className="font-sans text-[11px] font-medium uppercase tracking-tight text-muted-foreground/80">
              {settings.footerNote || "Independent Cinema · Storytelling Without Compromise"}
            </p>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={scrollToTop}
              className="group inline-flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-tight text-muted-foreground transition-colors hover:text-neon-ink"
            >
              <span>Back To Top</span>
              <span className="transition-transform duration-300 group-hover:-translate-y-0.5">
                ↑
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  outline,
  small = false,
}: {
  eyebrow: string;
  title: string;
  outline?: string;
  small?: boolean;
}) {
  // `small` tightens the display type for pages that want a lighter hero with responsive clamps.
  const size = small
    ? "text-[clamp(2.4rem,8vw,5.5rem)] md:text-[clamp(3.5rem,6vw,6.5rem)] leading-[0.88]"
    : "text-[clamp(3.2rem,13vw,8.5rem)] md:text-[clamp(4.5rem,9vw,11rem)] leading-[0.86]";
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-20 sm:pt-24 sm:pb-12 md:px-10 md:pt-44">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink"
      >
        {eyebrow}
      </motion.p>
      <h1 className={`mt-4 overflow-hidden font-display ${size}`}>
        <motion.span
          className="block"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {title}
        </motion.span>
      </h1>
      {outline && (
        <h2 className={`overflow-hidden font-display ${size} text-outline`}>
          <motion.span
            className="block"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {outline}
          </motion.span>
        </h2>
      )}
    </section>
  );
}

export function FilmCard({
  film,
  index = 0,
  tall = false,
  aspect,
}: {
  film: Film;
  index?: number;
  tall?: boolean;
  aspect?: string;
}) {
  const ratio = aspect ?? (tall ? "aspect-[4/5]" : "aspect-[4/3]");
  return (
    <Reveal delay={(index % 3) * 0.08}>
      <Link to={`/films/${film.slug}`} className="group block">
        <div className={`relative overflow-hidden rounded-2xl bg-card ${ratio}`}>
          <img
            src={film.poster}
            alt={film.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover grayscale-[30%] transition-all duration-[1.2s] ease-out group-hover:scale-110 group-hover:grayscale-0"
          />
          <div className="absolute inset-0 scrim-b opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute left-4 top-4 font-sans text-[11px] font-bold uppercase tracking-tight text-white/90">
            {String(index + 1).padStart(2, "0")} / {film.genre}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
            <span className="flex h-20 w-20 scale-50 items-center justify-center rounded-full bg-neon font-sans text-xs font-bold uppercase tracking-tight text-primary-foreground transition-transform duration-500 group-hover:scale-100">
              View
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <h3 className="font-display text-3xl text-white transition-colors duration-300 group-hover:text-neon md:text-4xl">
              {film.title}
            </h3>
            <p className="mt-2 translate-y-4 font-sans text-xs font-bold uppercase tracking-tight text-white/80 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              {film.director} — {film.release}
            </p>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

export function TrailerModal({
  film,
  open,
  onClose,
}: {
  film: Film;
  open: boolean;
  onClose: () => void;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!open) return setT(0);
    const id = setInterval(() => setT((x) => (x >= 100 ? 0 : x + 0.5)), 60);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      clearInterval(id);
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/95 p-4"
        >
          <motion.div
            initial={{ scaleY: 0.02, scaleX: 0.6 }}
            animate={{ scaleY: 1, scaleX: 1 }}
            exit={{ scaleY: 0.02 }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Trailer — ${film.title}`}
            className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-2xl bg-card"
          >
            <img
              src={film.poster}
              alt=""
              className="kenburns absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-[10%] bg-scrim" />
            <div className="absolute inset-x-0 bottom-0 h-[10%] bg-scrim" />
            <motion.p
              key={Math.floor(t / 25)}
              initial={{ opacity: 0, letterSpacing: "0.5em" }}
              animate={{ opacity: 1, letterSpacing: "0.05em" }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 flex items-center justify-center p-4 text-center font-display text-2xl sm:text-4xl md:text-6xl lg:text-8xl"
            >
              {[film.tagline, film.title, film.laurels[0], film.release][Math.floor(t / 25) % 4]}
            </motion.p>
            <div className="absolute inset-x-4 bottom-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-white sm:inset-x-6 sm:bottom-[3%] sm:gap-4 sm:text-[10px] sm:tracking-widest">
              <span className="truncate max-w-[160px] sm:max-w-none">Trailer — {film.title}</span>
              <div className="h-px flex-1 bg-white/25">
                <div className="h-px bg-neon" style={{ width: `${t}%` }} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute right-3 top-2 font-mono text-[10px] uppercase tracking-wider text-white hover:text-neon sm:right-4 sm:top-[2%] sm:text-xs sm:tracking-widest"
            >
              Close ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PlayButton({
  onClick,
  label = "Watch trailer",
  color,
}: {
  onClick: () => void;
  label?: string;
  /** Accent color for hover/pulse states; falls back to the site neon. */
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={color ? ({ "--play-accent": color } as CSSProperties) : undefined}
      className="group inline-flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-foreground cursor-pointer"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-foreground/70 transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--play-accent,var(--neon))] group-hover:bg-[var(--play-accent,var(--neon))] group-hover:text-primary-foreground">
        <span className="absolute inset-0 animate-ping rounded-full border border-[var(--play-accent,var(--neon-ink))] opacity-40" />
        ▶
      </span>
      <span className="transition-colors group-hover:text-[color:var(--play-accent,var(--neon-ink))]">
        {label}
      </span>
    </button>
  );
}

export function ScreenRequestModal({
  film,
  open,
  onClose,
}: {
  film: Film;
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [screeningType, setScreeningType] = useState("Theatrical / Cinema Booking");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setSubmitting(false);
    }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !organization.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Screen Request — ${film.title}`}
            className="relative my-8 w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0d] p-6 text-white shadow-2xl sm:p-8"
          >
            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-neon/10 blur-3xl" />

            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon font-bold">
                  Theatrical & Festival Bureau
                </span>
                <h3 className="mt-1 font-display text-2xl uppercase tracking-wide text-white sm:text-3xl">
                  Screen Request
                </h3>
                <p className="mt-1 font-sans text-xs text-white/70">
                  Request a theatrical DCP, 35mm print, or festival screener for{" "}
                  <strong className="text-white font-bold">{film.title}</strong> ({film.year}).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 p-2 text-white/60 transition-colors hover:border-white hover:text-white cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neon/15 border border-neon/30 text-neon text-2xl font-bold">
                  ✓
                </div>
                <h4 className="font-display text-2xl uppercase tracking-wide text-white">
                  Request Dispatched
                </h4>
                <p className="mx-auto max-w-md font-sans text-xs text-white/70 leading-relaxed">
                  Thank you, <strong>{name}</strong>. Your screening request for{" "}
                  <strong>{film.title}</strong> at <strong>{organization}</strong> has been logged with our theatrical sales bureau. We will review print availability and reach out to <strong>{email}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-none border border-white bg-white px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-105 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Your Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan Hayes"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Venue / Theater / Festival *
                    </label>
                    <input
                      required
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Metrograph Cinema"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="programmer@venue.com"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 0123"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      City / Location
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New York, NY"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                      Target Date / Window
                    </label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="e.g. November 2026"
                      className="h-10 w-full border border-white/15 bg-white/5 px-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                    Screening Type
                  </label>
                  <select
                    value={screeningType}
                    onChange={(e) => setScreeningType(e.target.value)}
                    className="h-10 w-full border border-white/15 bg-[#141418] px-3 font-sans text-xs text-white focus:border-neon focus:outline-none cursor-pointer"
                  >
                    <option value="Theatrical / Cinema Booking">Theatrical / Cinema Booking (DCP)</option>
                    <option value="Film Festival Screening">Film Festival Official Selection</option>
                    <option value="Repertory 35mm Print">Repertory 35mm Archival Print</option>
                    <option value="College / University Screening">College / University / Museum</option>
                    <option value="Press / Buyer Digital Screener">Press / Buyer Digital Screener</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-white/80">
                    Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Seating capacity, number of screenings, format preferences..."
                    className="w-full border border-white/15 bg-white/5 p-3 font-sans text-xs text-white placeholder-white/30 focus:border-neon focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <Link
                    to="/contact"
                    onClick={onClose}
                    className="font-sans text-xs text-white/60 hover:text-white underline"
                  >
                    Full Contact & Bureaus →
                  </Link>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="border border-white/20 px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-white hover:border-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="border border-neon bg-neon px-6 py-2 font-sans text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-105 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? "Sending…" : "Submit Request"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ScreenRequestButton({
  onClick,
  color,
  film,
}: {
  onClick?: () => void;
  color?: string;
  film?: Film | null;
}) {
  const [open, setOpen] = useState(false);
  // Only hide if the film explicitly disables screen requests (screenRequest === false)
  if (film?.screenRequest === false) return null;

  const targetFilm: Film = film ?? {
    title: "Fragrant Nature Slate",
    slug: "slate",
    director: "Fragrant Nature Studio",
    year: new Date().getFullYear(),
    genre: "Theatrical Selection",
    runtime: "",
    rating: "",
    poster: "",
    tagline: "Stories Worth The Dark",
    synopsis: "Theatrical, archival 35mm, and festival screening booking request.",
    cast: [],
    status: "now",
    release: "Current Slate",
    laurels: [],
    accent: color || "#7CFF3D",
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick ?? (() => setOpen(true))}
        style={color ? ({ "--screen-accent": color } as CSSProperties) : undefined}
        className="group inline-flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-foreground cursor-pointer"
        title={`Request a screening for ${targetFilm.title}`}
      >
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-foreground/70 transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--screen-accent,var(--neon))] group-hover:bg-[var(--screen-accent,var(--neon))] group-hover:text-primary-foreground">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <rect width="18" height="12" x="3" y="4" rx="2" />
            <line x1="2" x2="22" y1="20" y2="20" />
            <line x1="8" x2="8" y1="16" />
            <line x1="16" x2="16" y1="20" />
          </svg>
        </span>
        <span className="transition-colors group-hover:text-[color:var(--screen-accent,var(--neon-ink))]">
          Screen Request
        </span>
      </button>

      {!onClick && (
        <ScreenRequestModal
          film={targetFilm}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
