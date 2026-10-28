import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api } from "@/lib/api";
import { defaultNav, type NavEntry } from "@/lib/navigation";
import {
  awardsList,
  films as staticFilms,
  news as staticNews,
  type Award,
  type Category,
  type Film,
  type GalleryItem,
  type NewsArticle,
  type Subcategory,
} from "@/lib/films";

/**
 * Site settings key/value map. The well-known keys are declared so they can be
 * read as properties; anything else the admin adds lives behind the index
 * signature (accessed with brackets — `noPropertyAccessFromIndexSignature`).
 */
export type Settings = {
  siteName?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  address?: string;
  youtube?: string;
  instagram?: string;
  facebook?: string;
  footerNote?: string;
  [key: string]: string | undefined;
};

export const defaultSettings: Settings = {
  siteName: "Fragrant Nature Film Productions",
  tagline: "Stories Worth The Dark",
  email: "hello@fragrantnaturefilms.com",
  phone: "+1 (718) 555-0142",
  address: "Brooklyn · London · Kochi",
  youtube: "https://youtube.com",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
  footerNote: "Stories worth the dark, from the studio floor to your screen.",
};

/** Where a piece of content came from: the API, or the bundled catalogue. */
export type ContentSource = "loading" | "live" | "static";

type ContentState = {
  films: Film[];
  news: NewsArticle[];
  awards: Award[];
  categories: Category[];
  subcategories: Subcategory[];
  settings: Settings;
  navigation: NavEntry[];
  gallery: GalleryItem[];
  source: ContentSource;
  refresh: () => Promise<void>;
};

const isTest = import.meta.env.MODE === "test";

/** Bundled fallbacks — the site stays fully rendered if the API is down. */
const fallback: Omit<ContentState, "source" | "refresh"> = {
  films: staticFilms,
  news: staticNews,
  awards: awardsList,
  categories: [],
  subcategories: [],
  settings: defaultSettings,
  navigation: defaultNav,
  gallery: [],
};

const ContentContext = createContext<ContentState | null>(null);

type Resources = {
  films: Film[];
  news: NewsArticle[];
  awards: Award[];
  categories: Category[];
  subcategories: Subcategory[];
  settings: Settings;
  navigation: NavEntry[];
  gallery: GalleryItem[];
};

async function load(): Promise<Resources> {
  const [films, news, awards, categories, subcategories, settings, navigation, gallery] =
    await Promise.all([
      api.get<Film[]>("/api/films"),
      api.get<NewsArticle[]>("/api/news"),
      api.get<Award[]>("/api/awards"),
      api.get<Category[]>("/api/categories"),
      api.get<Subcategory[]>("/api/subcategories"),
      api.get<Settings>("/api/settings"),
      api.get<NavEntry[]>("/api/navigation"),
      api.get<GalleryItem[]>("/api/gallery").catch(() => []),
    ]);

  return {
    films: films.length ? films : staticFilms,
    news: news.length ? news : staticNews,
    awards: awards.length ? awards : awardsList,
    categories,
    subcategories,
    settings: { ...defaultSettings, ...settings },
    // An empty menu is never right — a seed that has not run yet should not
    // blank the nav, so keep the bundled six in that case too.
    navigation: navigation.length ? navigation : defaultNav,
    gallery,
  };
}

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    resources: Omit<ContentState, "source" | "refresh">;
    source: ContentSource;
  }>({ resources: fallback, source: isTest ? "static" : "loading" });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    // Tests never hit the network: jsdom has no API to talk to.
    if (isTest) return;
    try {
      const resources = await load();
      if (mounted.current) setState({ resources, source: "live" });
    } catch {
      // Server unreachable or answering with an error — keep rendering the
      // bundled catalogue rather than blanking the site out.
      if (mounted.current) setState((prev) => ({ ...prev, source: "static" }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<ContentState>(
    () => ({ ...state.resources, source: state.source, refresh }),
    [state, refresh],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

/**
 * Reads the shared catalogue. Outside a provider (isolated component render)
 * it degrades to the bundled data instead of throwing.
 */
export function useContent(): ContentState {
  const context = useContext(ContentContext);
  const refresh = useCallback(async () => {}, []);
  return context ?? { ...fallback, source: "static", refresh };
}

export const useFilms = () => useContent().films;
export const useNews = () => useContent().news;
export const useAwards = () => useContent().awards;
export const useSettings = () => useContent().settings;
export const useCategories = () => useContent().categories;
export const useSubcategories = () => useContent().subcategories;
export const useNavigation = () => useContent().navigation;
export const useGallery = () => useContent().gallery;

/** Lookups that mirror the helpers in `@/lib/films` but read live data. */
export function useFilmBySlug(slug?: string) {
  return useContent().films.find((f) => f.slug === slug);
}

/** `getFilm()` bound to the current catalogue — safe to call in any component. */
export function useFilmLookup() {
  const films = useContent().films;
  return useCallback((slug: string) => films.find((f) => f.slug === slug), [films]);
}

export function useNewsById(id?: string) {
  const list = useContent().news;
  if (!id) return undefined;
  return list.find((n) => String(n.id) === id);
}
