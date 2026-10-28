import { describe, expect, it } from "vitest";

import { buildNavItems, defaultNav } from "@/lib/navigation";

// Real payload shape from GET /api/navigation (visible entries, order asc).
const FROM_API = [
  { label: "Films", to: "/films", order: 0 },
  { label: "Upcoming", to: "/upcoming", order: 1 },
  { label: "Awards", to: "/awards", order: 2 },
  { label: "Gallery", to: "/gallery", order: 3 },
  { label: "About", to: "/about", order: 4 },
  { label: "Contact", to: "/contact", order: 5 },
];

describe("public menu from backend data", () => {
  it("renders exactly the entries the API returned, in the given order", () => {
    const items = buildNavItems(FROM_API);

    expect(items.map((item) => item.label)).toEqual([
      "Films",
      "Upcoming",
      "Awards",
      "Gallery",
      "About",
      "Contact",
    ]);
    expect(items[0]?.to).toBe("/films");
  });

  it("keeps the News dropdown attached to the entry that links to /about", () => {
    // Admin renamed the label — the dropdown must survive the rename.
    const items = buildNavItems([
      { label: "Studio", to: "/about", order: 0 },
      { label: "Contact", to: "/contact", order: 1 },
    ]);

    expect(items[0]?.subcategories).toHaveLength(1);
    expect(items[0]?.subcategories?.[0]).toMatchObject({ to: "/news", label: "News" });
    // Entries pointing anywhere else get no dropdown.
    expect(items[1]?.subcategories).toBeUndefined();
  });

  it("drops the dropdown when no entry links to /about any more", () => {
    const items = buildNavItems([{ label: "Company", to: "/studio", order: 0 }]);

    expect(items[0]?.subcategories).toBeUndefined();
  });

  it("handles an empty menu without inventing items", () => {
    expect(buildNavItems([])).toEqual([]);
  });

  it("bundles the same six defaults the seed writes", () => {
    expect(defaultNav.map((entry) => entry.to)).toEqual([
      "/films",
      "/upcoming",
      "/awards",
      "/gallery",
      "/about",
      "/contact",
    ]);
    // The bundled About entry must carry the dropdown too, via the same mapper.
    expect(buildNavItems(defaultNav)[4]?.subcategories).toHaveLength(1);
  });
});
