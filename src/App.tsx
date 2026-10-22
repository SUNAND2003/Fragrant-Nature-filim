import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";

import { SiteFooter, SiteHeader } from "@/components/site";
import { ErrorBoundary } from "@/components/error-boundary";
import { HomePage } from "@/pages/home";
import { FilmsPage } from "@/pages/films";
import { FilmPage } from "@/pages/film";
import { UpcomingPage } from "@/pages/upcoming";
import { GalleryPage } from "@/pages/gallery";
import { NewsPage } from "@/pages/news";
import { AboutPage } from "@/pages/about";
import { LoginPage } from "@/pages/login";
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

  return (
    <>
      <ScrollToTop />
      <SiteHeader />
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
              <Route path="/films/:slug" element={<FilmPage />} />
              <Route path="/upcoming" element={<UpcomingPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/news" element={<NewsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </motion.main>
      </AnimatePresence>
      {/* The login page is a full-screen split layout — no site footer below it. */}
      {location.pathname !== "/login" && <SiteFooter />}
    </>
  );
}
