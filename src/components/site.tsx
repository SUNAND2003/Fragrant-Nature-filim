import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import logo from "@/assets/icon.png";
import { useLikes } from "@/lib/likes";
import { getFilm, type Film } from "@/lib/films";

const nav = [
  { to: "/films", label: "Movies" },
  { to: "/upcoming", label: "Upcoming" },
  { to: "/gallery", label: "Gallery" },
  { to: "/news", label: "News" },
  { to: "/about", label: "About" },
] as const;

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

/** Left-hand arrow that slides in when a menu item is hovered. */
function MenuArrow() {
  return (
    <span className="pointer-events-none absolute -left-8 top-1/2 -translate-x-3 -translate-y-1/2 text-neon-ink opacity-0 transition-all duration-300 group-hover/link:translate-x-0 group-hover/link:opacity-100 md:-left-14">
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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Live like indicator: mirrors the shared likes store, so it fills and
  // counts up the moment a film is hearted anywhere (e.g. the hero button).
  const { likes, toggle, clear } = useLikes();
  const likedCount = likes.length;
  const [likesOpen, setLikesOpen] = useState(false);
  const likedFilms = likes.map((slug) => getFilm(slug)).filter((f): f is Film => Boolean(f));
  const { pathname } = useLocation();
  // The likes panel closes on Escape and whenever the route changes.
  useEffect(() => {
    setLikesOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!likesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLikesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [likesOpen]);
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
      className={`theme-dark fixed inset-x-0 top-0 z-50 text-foreground transition-colors duration-500 ${overHero ? "bg-transparent" : "bg-black"}`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:bg-neon focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-5 py-1.5 md:px-10 md:py-2">
        <div className="col-start-1" aria-hidden />
        <Link
          to="/"
          className="col-start-2 flex items-center justify-self-center"
          aria-label="Fragrant Nature — home"
        >
          <img src={logo} alt="Fragrant Nature Film Productions" className="w-40 md:w-56" />
        </Link>
        <div className="col-start-3 flex items-center justify-self-end gap-1">
          <Link
            to="/login"
            aria-label="Login"
            className="p-2.5 transition-colors hover:text-neon-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 md:h-6 md:w-6"
              aria-hidden
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
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
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-neon-ink">
                  Liked {likedCount > 0 ? `· ${likedCount}` : ""}
                </p>
                {likedCount > 0 && (
                  <button
                    type="button"
                    onClick={clear}
                    className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
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
                          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
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
            className="theme-dark absolute inset-x-0 top-full flex h-[100svh] flex-col items-center justify-center gap-4 overflow-x-hidden overflow-y-auto bg-black px-5 py-10 md:gap-7 md:px-10"
          >
            {nav.map((n, i) => (
              <motion.div
                key={n.to}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.08 }}
              >
                <Link
                  to={n.to}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === n.to ? "page" : undefined}
                  className="group/link relative block text-center font-display text-4xl md:text-6xl hover:text-neon-ink"
                >
                  <span className="inline-block transition-transform duration-300 ease-out group-hover/link:translate-x-3 md:group-hover/link:translate-x-5">
                    {n.label}
                  </span>
                  <MenuArrow />
                </Link>
              </motion.div>
            ))}

            {/* Socials sit below the menu, pushed toward the bottom of the sheet. */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + nav.length * 0.08 }}
              className="mt-8 flex items-center gap-4 md:mt-12"
            >
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="theme-dark border-t border-border bg-background text-foreground">
      <div className="overflow-hidden border-b border-border py-4">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-3xl md:text-5xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>Stories worth the dark</span>
              <span className="text-neon-ink"></span>
              <span className="text-outline">See it big</span>
              <span className="text-accent"></span>
              <span>Stories worth the dark</span>
              <span className="text-neon-ink"></span>
              <span className="text-outline">See it big</span>
              <span className="text-accent"></span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <img src={logo} alt="Fragrant Nature Film Productions" className="w-64 md:w-96" />
          <p className="mt-4 max-w-sm text-muted-foreground">
            An independent film studio for unruly, unforgettable cinema.
          </p>
        </div>
        <div className="space-y-2 font-mono text-xs uppercase tracking-[0.2em]">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="block hover:text-neon-ink">
              {n.label}
            </Link>
          ))}
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Newsletter
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-3 flex border-b border-foreground"
          >
            <input
              type="email"
              aria-label="Email address"
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full bg-transparent py-2 placeholder:text-muted-foreground"
            />
            <button className="font-mono text-xs uppercase text-neon-ink">Join →</button>
          </form>
        </div>
      </div>
      <p className="px-5 pb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:px-10">
        © 2026 Fragrant Nature. A fictional studio.
      </p>
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
  // `small` tightens the display type for pages that want a lighter hero.
  const size = small ? "text-[9vw] md:text-[6vw]" : "text-[14vw] md:text-[9vw]";
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-12 pt-36 md:px-10 md:pt-44">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-xs uppercase tracking-[0.3em] text-neon-ink"
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
          <div className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/85">
            {String(index + 1).padStart(2, "0")} / {film.genre}
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100">
            <span className="flex h-20 w-20 scale-50 items-center justify-center rounded-full bg-neon font-mono text-[10px] uppercase tracking-widest text-primary-foreground transition-transform duration-500 group-hover:scale-100">
              View
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <h3 className="font-display text-3xl text-white transition-colors duration-300 group-hover:text-neon md:text-4xl">
              {film.title}
            </h3>
            <p className="mt-2 translate-y-4 font-mono text-xs uppercase tracking-[0.2em] text-white/70 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
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
              className="absolute inset-0 flex items-center justify-center text-center font-display text-5xl md:text-8xl"
            >
              {[film.tagline, film.title, film.laurels[0], film.release][Math.floor(t / 25) % 4]}
            </motion.p>
            <div className="absolute inset-x-6 bottom-[3%] flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-white">
              <span>Trailer — {film.title}</span>
              <div className="h-px flex-1 bg-white/25">
                <div className="h-px bg-neon" style={{ width: `${t}%` }} />
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-[2%] font-mono text-xs uppercase tracking-widest text-white hover:text-neon"
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
      className="group inline-flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-foreground"
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
