import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useState } from "react";

import { login, logout, useSession } from "@/lib/auth";
import { usePageMeta } from "@/lib/use-page-meta";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type FormValues = z.infer<typeof schema>;

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
      <section className="mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-center px-5 md:px-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-ink">Signed in</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,7rem)] uppercase leading-[0.85] text-neon-ink">
          Welcome back
        </h1>
        <p className="mt-6 font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {session}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
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
      </section>
    );
  }

  const fieldClass =
    "mt-2 w-full border-b border-foreground/30 bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground focus:border-neon-ink";

  return (
    <section className="mx-auto grid min-h-[100svh] max-w-[1600px] items-center gap-16 px-5 py-36 md:grid-cols-2 md:px-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-neon-ink">Members</p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,7rem)] uppercase leading-[0.82] text-neon-ink">
          Sign in
        </h1>
        <p className="mt-6 max-w-sm text-lg text-muted-foreground">
          Early screenings, ticket presales and dispatches — straight to your inbox.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-8" noValidate>
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
          <label
            htmlFor="password"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            Password
          </label>
          <div className="relative mt-2">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
              className={`${fieldClass} mt-0 pr-16`}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-neon-ink"
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

        <button
          type="submit"
          disabled={isSubmitting || done}
          className="w-full border border-foreground px-6 py-4 font-mono text-xs uppercase tracking-[0.25em] transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground disabled:opacity-50"
        >
          {done ? "Signed in ✓" : isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}
