import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type CSSProperties } from "react";
import logo from "@/assets/logo.png";
import { logout, useSession } from "@/lib/auth";
import type { Film } from "@/lib/films";

const nav = [
  { to: "/films", label: "Films" },
  { to: "/upcoming", label: "Upcoming" },
  { to: "/news", label: "News" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const session = useSession();
  const { pathname } = useLocation();
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
      <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center px-5 py-4 md:px-10">
        <div className="col-start-1" aria-hidden />
        <Link
          to="/"
          className="col-start-2 flex items-center justify-self-center"
          aria-label="Fragrant Nature — home"
        >
          <img src={logo} alt="Fragrant Nature Film Productions" className="h-14 w-auto md:h-20" />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="col-start-3 justify-self-end p-2"
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
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            className="theme-dark absolute inset-x-0 top-full h-[100svh] overflow-y-auto bg-black px-5 pt-10 md:px-10 md:pt-16"
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
                  className="block font-display text-4xl md:text-6xl hover:text-neon-ink"
                >
                  {n.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + nav.length * 0.08 }}
            >
              {session ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="block font-display text-4xl md:text-6xl text-neon-ink hover:opacity-80"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block font-display text-4xl md:text-6xl hover:text-neon-ink"
                >
                  Login
                </Link>
              )}
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
      <div className="overflow-hidden border-b border-border py-6">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-6xl md:text-8xl">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>Stories worth the dark</span>
              <span className="text-neon-ink">✺</span>
              <span className="text-outline">See it big</span>
              <span className="text-accent">✺</span>
              <span>Stories worth the dark</span>
              <span className="text-neon-ink">✺</span>
              <span className="text-outline">See it big</span>
              <span className="text-accent">✺</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <img src={logo} alt="Fragrant Nature Film Productions" className="h-32 w-auto md:h-44" />
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
          <Link to="/login" className="block hover:text-neon-ink">
            Login
          </Link>
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
              placeholder="your@email.com"
              className="w-full bg-transparent py-2 outline-none placeholder:text-muted-foreground"
            />
            <button className="font-mono text-xs uppercase text-neon-ink">Join →</button>
          </form>
        </div>
      </div>
      <p className="px-5 pb-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:px-10">
        © 2026 Lumen Pictures. A fictional studio.
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
}: {
  eyebrow: string;
  title: string;
  outline?: string;
}) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-12 pt-36 md:px-10 md:pt-44">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-mono text-xs uppercase tracking-[0.3em] text-neon-ink"
      >
        {eyebrow}
      </motion.p>
      <h1 className="mt-4 overflow-hidden font-display text-[14vw] md:text-[9vw]">
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
        <h2 className="overflow-hidden font-display text-[14vw] text-outline md:text-[9vw]">
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
      className="group inline-flex items-center gap-4 font-mono text-xs uppercase tracking-[0.25em] text-white"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/70 transition-all duration-500 group-hover:scale-110 group-hover:border-[var(--play-accent,var(--neon))] group-hover:bg-[var(--play-accent,var(--neon))] group-hover:text-primary-foreground">
        <span className="absolute inset-0 animate-ping rounded-full border border-[var(--play-accent,var(--neon))] opacity-40" />
        ▶
      </span>
      <span className="transition-colors group-hover:text-[color:var(--play-accent,var(--neon))]">
        {label}
      </span>
    </button>
  );
}
