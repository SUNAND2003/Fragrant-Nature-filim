import { Loader2, LogOut, ExternalLink } from "lucide-react";
import { NavLink, Navigate, Route, Routes } from "react-router";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import siteLogo from "@/assets/logo.png";
import { AdminAuth, useAdminAuth } from "@/pages/admin/auth";
import { AdminLoginPage } from "@/pages/admin/login";
import { DashboardSection } from "@/pages/admin/dashboard";
import { FilmsSection } from "@/pages/admin/films";
import { CategoriesSection } from "@/pages/admin/categories";
import { GallerySection } from "@/pages/admin/gallery";
import { NavigationSection } from "@/pages/admin/navigation";
import { NewsSection } from "@/pages/admin/news";
import { AwardsSection } from "@/pages/admin/awards";
import { SettingsSection } from "@/pages/admin/settings";

const NAV: { to: string; label: string; end: boolean }[] = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/films", label: "Films", end: false },
  { to: "/admin/categories", label: "Categories", end: false },
  { to: "/admin/gallery", label: "Gallery", end: false },
  { to: "/admin/navigation", label: "Navigation", end: false },
  { to: "/admin/news", label: "News", end: false },
  { to: "/admin/awards", label: "Awards", end: false },
  { to: "/admin/settings", label: "Settings", end: false },
];

function AdminShell() {
  const { admin, signOut } = useAdminAuth();

  return (
    <div className="admin-shell min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors closeButton theme="light" />

      {/* Black sidebar: the wordmark is white artwork, so it needs the dark plate.
          `theme-dark` scopes the palette so every label/border stays legible on it. */}
      <aside className="theme-dark fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-black text-foreground lg:flex">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-5">
          <img
            src={siteLogo}
            alt="Fragrant Nature Film Creations"
            className="h-auto w-44 drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
          />
          <p className="font-sans text-[10px] uppercase tracking-widest text-white/80 font-semibold">
            Studio Admin
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto bg-black p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block border px-4 py-2.5 font-sans text-xs font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? "border-white bg-white text-black shadow-sm"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-4 py-2 font-sans text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </NavLink>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start rounded-none"
            onClick={signOut}
          >
            <LogOut /> {admin ? admin.name : "Sign out"}
          </Button>
        </div>
      </aside>

      {/* Compact header for phones/tablets: the same nav, scrollable. */}
      <header className="theme-dark sticky top-0 z-30 border-b border-border bg-black text-foreground lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <img src={siteLogo} alt="Fragrant Nature Film Creations" className="h-auto w-32" />
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className="font-sans text-xs uppercase tracking-widest text-muted-foreground"
            >
              Site
            </NavLink>
            <button
              type="button"
              onClick={signOut}
              className="font-sans text-xs uppercase tracking-widest text-muted-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto bg-black px-2 pb-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap border px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-widest ${
                  isActive
                    ? "border-white bg-white text-black"
                    : "border-border text-muted-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="px-5 py-8 lg:pr-10 lg:pl-[17rem]">
        <div className="mx-auto max-w-6xl">
          <Routes>
            <Route index element={<DashboardSection />} />
            <Route path="films" element={<FilmsSection />} />
            <Route path="categories" element={<CategoriesSection />} />
            <Route path="gallery" element={<GallerySection />} />
            <Route path="subcategories" element={<Navigate to="/admin/categories" replace />} />
            <Route path="navigation" element={<NavigationSection />} />
            <Route path="news" element={<NewsSection />} />
            <Route path="awards" element={<AwardsSection />} />
            <Route path="media" element={<Navigate to="/admin" replace />} />
            <Route path="settings" element={<SettingsSection />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Gate() {
  const { admin, checking, offline } = useAdminAuth();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-neon-ink" />
      </div>
    );
  }

  if (offline) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center bg-background text-foreground">
        <p className="font-display text-4xl uppercase">API offline</p>
        <p className="max-w-md font-sans text-sm text-muted-foreground">{offline}</p>
        <p className="max-w-md font-sans text-xs text-muted-foreground">
          Start it with <code className="text-neon-ink">npm run backend</code>, then run{" "}
          <code className="text-neon-ink">npm run seed</code> once to load the catalogue.
        </p>
        <Button type="button" className="rounded-none" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return admin ? <AdminShell /> : <AdminLoginPage />;
}

/** Route element for `/admin/*` — auth gate around the panel. */
export function AdminArea() {
  return (
    <AdminAuth>
      <Gate />
    </AdminAuth>
  );
}
