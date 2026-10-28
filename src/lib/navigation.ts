/**
 * The public menu: shared types, the bundled fallback, and the pure mapping
 * from raw API entries to menu items. Kept out of `content.tsx` so it can be
 * unit-tested with real payloads (that provider never touches the network).
 */

/** One entry as `/api/navigation` returns it (visible list, sorted by order). */
export type NavEntry = {
  _id?: string;
  label: string;
  to: string;
  order?: number;
  visible?: boolean;
  subcategories?: MenuSubcategory[];
};

export type MenuSubcategory = {
  _id?: string | undefined;
  to: string;
  label: string;
  description?: string | undefined;
};

/** What the header menu and footer Navigation column actually render. */
export type NavMenuItem = {
  _id?: string | undefined;
  to: string;
  label: string;
  subcategories?: readonly MenuSubcategory[] | undefined;
};

/** Bundled menu — used until the API answers (or while it is down). */
export const defaultNav: NavEntry[] = [
  { label: "Movies", to: "/films", subcategories: [] },
  { label: "Upcoming", to: "/upcoming", subcategories: [] },
  { label: "Awards", to: "/awards", subcategories: [] },
  { label: "Gallery", to: "/gallery", subcategories: [] },
  {
    label: "About",
    to: "/about",
    subcategories: [
      {
        to: "/news",
        label: "News",
        description: "Festival honors, press announcements, and studio updates",
      },
    ],
  },
  { label: "Contact", to: "/contact", subcategories: [] },
];

// The default News subcategory dropdown hangs off the About entry.
const aboutSubcategories: readonly MenuSubcategory[] = [
  {
    to: "/news",
    label: "News",
    description: "Festival honors, press announcements, and studio updates",
  },
];

/**
 * Raw API entries → menu items. Order is preserved exactly as given (the API
 * sorts by `order`). If an entry has custom subcategories, they are rendered;
 * if empty and pointing to `/about`, falls back to the default News subcategory.
 */
export function buildNavItems(entries: readonly NavEntry[]): NavMenuItem[] {
  return entries.map((entry) => {
    const subcategories =
      entry.subcategories && entry.subcategories.length > 0
        ? entry.subcategories
        : entry.to === "/about"
          ? aboutSubcategories
          : undefined;

    const item: NavMenuItem = {
      to: entry.to,
      label: entry.label,
    };
    if (entry._id) item._id = entry._id;
    if (subcategories && subcategories.length > 0) item.subcategories = subcategories;
    return item;
  });
}
