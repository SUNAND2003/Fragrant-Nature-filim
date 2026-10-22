import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

import { login, logout, useSession } from "@/lib/auth";
import { heroImage } from "@/lib/films";
import { usePageMeta } from "@/lib/use-page-meta";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormValues = z.infer<typeof schema>;

/** Shared left-hand cinematic panel so both states (signed out / signed in) match. */
function Entrance() {
  return (
    <div className="relative h-[34svh] overflow-hidden md:h-auto">
      <img
        src={heroImage}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-[58%_45%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/25 md:bg-gradient-to-r md:from-black/85 md:via-black/45 md:to-black/10" />
      <div className="relative flex h-full flex-col justify-end gap-8 p-5 md:justify-between md:p-10 md:pt-28">
        <Link
          to="/"
          className="hidden w-fit font-mono text-[11px] uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-neon md:inline-flex"
        >
          ← Back to site
        </Link>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neon">
            Fragrant Nature — Members
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,5rem)] uppercase leading-[0.84] text-white">
            Members'
            <br />
            <span className="text-neon">entrance</span>
          </h1>
          <p className="mt-5 max-w-sm text-white/70">
            Early screenings, ticket presales and dispatches — straight to your inbox.
          </p>
        </div>
        <dl className="hidden gap-8 md:flex">
          {[
            ["42", "films released"],
            ["18", "festival awards"],
            ["6", "in theaters"],
          ].map(([n, label]) => (
            <div key={label}>
              <dt className="font-display text-3xl text-white">{n}</dt>
              <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function LoginPage() {
  usePageMeta({
    title: "Login — Fragrant Nature",
    description: "Sign in to your Fragrant Nature account.",
  });

  const session = useSession();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    // Mock sign-in — replace with a real API call when a backend exists.
    await new Promise((r) => setTimeout(r, 700));
    login(data.email);
    setDone(true);
    setTimeout(() => navigate("/"), 600);
  };

  if (session) {
    return (
      <section className="theme-dark grid min-h-[100svh] bg-background text-foreground md:grid-cols-2">
        <Entrance />
        <div className="flex items-center justify-center px-5 py-20 md:px-8 md:py-24">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl sm:p-8 md:p-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neon-ink">
              Signed in
            </p>
            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] uppercase leading-[0.86]">
              Welcome back
            </h1>
            <p className="mt-5 break-all rounded-xl border border-border bg-black/40 px-4 py-3 font-mono text-sm text-muted-foreground">
              {session}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={logout}
                className="border border-foreground px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground"
              >
                Log out
              </button>
              <Link
                to="/"
                className="border border-border px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-foreground"
              >
                Back home
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-border bg-black/40 px-4 py-3 text-lg text-foreground transition-colors placeholder:text-muted-foreground focus:border-neon-ink";

  return (
    <section className="theme-dark grid min-h-[100svh] bg-background text-foreground md:grid-cols-2">
      <Entrance />

      <div className="flex items-center justify-center px-5 py-16 md:px-8 md:py-24">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="w-full max-w-md rounded-3xl border border-border bg-card/70 p-6 backdrop-blur-xl sm:p-8 md:p-10"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-neon-ink">
            Members' access
          </p>
          <h2 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.25rem)] uppercase leading-[0.86]">
            Sign in
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Welcome back — your seats are waiting.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="email"
                className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className={fieldClass}
              />
              {errors.email && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-4">
                <label
                  htmlFor="password"
                  className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
                >
                  Password
                </label>
                <a
                  href="mailto:hello@fragrantnature.film?subject=Password%20reset"
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-neon-ink"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`${fieldClass} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-neon-ink"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || done}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-neon px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] text-primary-foreground transition-colors hover:bg-neon-ink disabled:opacity-50"
          >
            {isSubmitting && (
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden>
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="opacity-25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {done ? "Signed in ✓" : isSubmitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Demo access — any email with a 6+ character password
          </p>

          <div className="mt-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Link
            to="/"
            className="mt-6 block w-full rounded-xl border border-border px-6 py-4 text-center font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-foreground"
          >
            Continue as guest
          </Link>
        </form>
      </div>
    </section>
  );
}
