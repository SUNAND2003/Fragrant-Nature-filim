import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";

import { SiteFooter, SiteHeader } from "@/components/site";
import { ErrorBoundary } from "@/components/error-boundary";
import { ContentProvider } from "@/lib/content";
import { HomePage } from "@/pages/home";
import { FilmsPage } from "@/pages/films";
import { CategoriesPage } from "@/pages/categories";
import { FilmPage } from "@/pages/film";
import { UpcomingPage } from "@/pages/upcoming";
import { GalleryPage } from "@/pages/gallery";
import { NewsPage } from "@/pages/news";
import { NewsArticlePage } from "@/pages/news-article";
import { AwardsPage } from "@/pages/awards";
import { AboutPage } from "@/pages/about";
import { ContactPage } from "@/pages/contact";
import { LoginPage } from "@/pages/login";
import { AdminArea } from "@/pages/admin";
import { NotFoundPage } from "@/pages/not-found";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  // The login split layout and the admin panel are full-screen — no site chrome.
  const chromeless = isAdmin || location.pathname === "/login";

  return (
    <ContentProvider>
      <ScrollToTop />
      {!isAdmin && <SiteHeader />}
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="pointer-events-none fixed inset-0 z-[80] origin-top bg-neon"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          />
          <ErrorBoundary key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/films" element={<FilmsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/films/:slug" element={<FilmPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/awards" element={<AwardsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/news/:id" element={<NewsArticlePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/*" element={<AdminArea />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </motion.main>
      </AnimatePresence>
      {!chromeless && <SiteFooter />}
    </ContentProvider>
  );
}
