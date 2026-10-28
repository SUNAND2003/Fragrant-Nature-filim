import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAdminAuth } from "@/pages/admin/auth";
import { ApiError } from "@/lib/api";
import siteLogo from "@/assets/logo.png";

export function AdminLoginPage() {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedDemo, setCopiedDemo] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.getModifierState) {
      setCapsLock(event.getModifierState("CapsLock"));
    }
  };

  const handleQuickFill = () => {
    setEmail("admin");
    setPassword("admin1234");
    setError(null);
    setCopiedDemo(true);
    setTimeout(() => setCopiedDemo(false), 2000);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (cause) {
      if (cause instanceof ApiError) {
        if (cause.status === 0 || cause.status === 502 || cause.status === 503) {
          setError("API server is offline. Please start the backend with: npm run backend");
        } else if (cause.status === 401 || cause.status === 400) {
          setError("Invalid username or password. Please verify or use the Autofill button.");
        } else {
          setError(cause.message);
        }
      } else if (cause instanceof Error) {
        setError(cause.message);
      } else {
        setError("Sign in failed. Verify the backend is running on port 4000.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="theme-dark relative min-h-screen w-full overflow-hidden bg-[#070709] text-white font-sans antialiased selection:bg-neon selection:text-black flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* ================= ANIMATED CINEMATIC BACKGROUND EFFECTS ================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Animated Floating Neon Orb 1 */}
        <motion.div
          animate={{
            x: [0, 45, -35, 0],
            y: [0, -55, 25, 0],
            scale: [1, 1.18, 0.94, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 16,
            ease: "easeInOut",
          }}
          className="absolute -top-32 -left-32 h-[550px] w-[550px] rounded-full bg-neon/15 blur-[150px]"
        />

        {/* Animated Floating Pink / Violet Orb 2 */}
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 45, -40, 0],
            scale: [1, 1.22, 0.92, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "easeInOut",
          }}
          className="absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full bg-neon-pink/10 blur-[160px]"
        />

        {/* Center ambient spotlight */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[650px] w-[650px] rounded-full bg-neon/8 blur-[180px]" />

        {/* Subtle Film Grain Noise Overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Subtle Dark Studio Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ================= TOP NAVIGATION BAR ================= */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link
          to="/"
          className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 backdrop-blur-md transition-all duration-300 hover:border-neon/60 hover:bg-white/[0.08]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-white/60 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-neon" />
          <span className="font-sans text-xs font-bold uppercase tracking-wider text-white/90">
            Return to Site
          </span>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
          <Radio className="h-3 w-3 animate-pulse text-neon" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neon">
            Studio OS Active
          </span>
        </div>
      </header>

      {/* ================= MAIN ANIMATED LOGIN CARD ================= */}
      <main className="relative z-10 my-auto flex items-center justify-center py-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[460px]"
        >
          {/* Subtle Outer Neon Aura behind Card */}
          <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-neon/25 via-transparent to-neon/20 opacity-70 blur-2xl transition-all duration-500 group-hover:opacity-100" />

          {/* Black Glass Card Container */}
          <div className="relative rounded-2xl border border-white/15 bg-[#0a0a0d]/95 p-6 sm:p-9 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_50px_rgba(198,255,0,0.06)] backdrop-blur-2xl">
            {/* Top Brand Logo & Wordmark */}
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                className="inline-block relative"
              >
                {/* Glow aura behind logo */}
                <div className="absolute -inset-2 rounded-full bg-neon/15 blur-lg opacity-60" />
                <Link
                  to="/"
                  className="inline-block rounded-2xl bg-white/[0.04] border border-white/10 px-6 py-4.5 transition-transform duration-300 hover:scale-105 shadow-inner"
                >
                  <img
                    src={siteLogo}
                    alt="Fragrant Nature Film Creations"
                    className="relative mx-auto h-auto w-40 sm:w-48 drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]"
                  />
                </Link>
              </motion.div>

              <div className="mt-5 flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-gradient-to-r from-transparent to-neon/50" />
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neon font-bold">
                  Admin Console
                </p>
                <span className="h-px w-6 bg-gradient-to-l from-transparent to-neon/50" />
              </div>

              <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-white sm:text-4xl">
                Sign In
              </h1>
              <p className="mt-1.5 font-sans text-xs text-white/60">
                Enter your authorized credentials to manage the studio slate.
              </p>
            </div>

            {/* Quick Demo Autofill Pill */}
            <div className="mt-6 rounded-xl border border-neon/30 bg-neon/[0.08] p-3.5 backdrop-blur-sm transition-all duration-300 hover:border-neon/50 hover:bg-neon/[0.12]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-left">
                  <Sparkles className="h-4 w-4 shrink-0 text-neon" />
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-white">
                      Demo Access
                    </p>
                    <p className="font-mono text-[10px] text-white/70">
                      <span className="text-white font-semibold">admin</span> /{" "}
                      <span className="text-white font-semibold">admin1234</span>
                    </p>
                  </div>
                </div>

                <motion.button
                  id="quick-autofill-btn"
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickFill}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    copiedDemo
                      ? "border-neon bg-neon text-black shadow-md shadow-neon/30"
                      : "border-neon/40 bg-neon/15 text-neon hover:bg-neon hover:text-black"
                  }`}
                >
                  {copiedDemo ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Filled!
                    </>
                  ) : (
                    "Autofill"
                  )}
                </motion.button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
              {/* Username Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="flex items-center justify-between font-sans text-xs font-bold uppercase tracking-wider text-white/90"
                >
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-neon" /> Username
                  </span>
                </label>
                <div className="relative group">
                  <input
                    id="admin-email"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin"
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 font-sans text-sm text-white placeholder:text-white/35 transition-all duration-200 focus:border-neon focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-neon/30"
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 font-mono text-xs text-white/40 hover:text-white"
                      aria-label="Clear username"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="admin-password"
                    className="flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-wider text-white/90"
                  >
                    <Lock className="h-3.5 w-3.5 text-neon" /> Password
                  </label>
                </div>
                <div className="relative group">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onKeyDown={handleKeyDown}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3.5 pr-11 font-sans text-sm text-white placeholder:text-white/35 transition-all duration-200 focus:border-neon focus:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-neon/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/50 transition-colors hover:text-neon"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {capsLock && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-1.5 pt-1 font-sans text-[11px] font-semibold text-amber-400"
                  >
                    <AlertCircle className="h-3.5 w-3.5" /> Caps Lock is ON
                  </motion.p>
                )}
              </div>

              {/* Error Message with AnimatePresence */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    role="alert"
                    className="flex items-start gap-2.5 rounded-xl border border-red-500/50 bg-red-950/60 p-3 text-red-200 backdrop-blur-sm"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <p className="font-sans text-xs leading-tight text-red-200">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                id="admin-login-submit"
                type="submit"
                disabled={busy}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="group relative mt-3 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-neon px-6 font-display text-base uppercase tracking-wider text-black font-bold transition-all duration-200 hover:bg-[#d8ea00] hover:shadow-[0_0_35px_rgba(198,255,0,0.5)] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(198,255,0,0.25)]"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 transition-transform group-hover:rotate-45" />
                    <span>Enter Studio Console</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Switch to Public Member Entrance */}
            <div className="mt-6 border-t border-white/10 pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-sans text-xs text-white/50 transition-colors hover:text-white"
              >
                Public Member?{" "}
                <span className="text-neon underline underline-offset-4 font-semibold">
                  Members Entrance →
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ================= BOTTOM FOOTER ================= */}
      <footer className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto border-t border-white/10 pt-4 text-xs text-white/40">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-neon" />
          <span>Encrypted Studio Gate</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider">
          Fragrant Nature Film Creations
        </p>
      </footer>
    </div>
  );
}
