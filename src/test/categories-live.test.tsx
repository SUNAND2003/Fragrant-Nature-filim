import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { App } from "@/App";

// Real payloads as the API returns them (shape: populated refs + timestamps).
const CATEGORIES = [
  {
    _id: "6ae0394b94ec94cf956398b7",
    slug: "feature-films",
    name: "Feature Films",
    description: "Narrative features from the Fragrant Nature slate.",
    accent: "#7CFF3D",
    order: 0,
  },
  {
    _id: "6ae0394b94ec94cf956398b8",
    slug: "documentaries",
    name: "Documentaries",
    description: "Non-fiction work and documentary shorts.",
    accent: "#38BDF8",
    order: 1,
  },
];

const SUBCATEGORIES = [
  {
    _id: "6ae0394b94ec94cf95639901",
    slug: "horror",
    name: "Horror",
    order: 0,
    category: { _id: "6ae0394b94ec94cf956398b7", slug: "feature-films", name: "Feature Films" },
  },
  {
    _id: "6ae0394b94ec94cf95639902",
    slug: "nature-docs",
    name: "Nature Docs",
    order: 0,
    category: { _id: "6ae0394b94ec94cf956398b8", slug: "documentaries", name: "Documentaries" },
  },
];

describe("Categories page with live API data", () => {
  beforeEach(() => {
    // The app-wide loader skips the network in tests; this page fetches its own
    // taxonomy, so we stub fetch with the real API shapes to prove the render.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/categories")) return jsonResponse(CATEGORIES);
        if (url.includes("/api/subcategories")) return jsonResponse(SUBCATEGORIES);
        return jsonResponse([]);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows every category card with its subcategories inside", async () => {
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <App />
      </MemoryRouter>,
    );

    // Both cards render from the fetched payload.
    expect(await screen.findByRole("heading", { name: "Feature Films" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documentaries" })).toBeInTheDocument();

    // Subcategories are nested inside the page as clickable chips.
    const horror = await screen.findByRole("link", { name: /horror/i });
    expect(horror).toHaveAttribute("href", "/films?category=feature-films&subcategory=horror");
    expect(screen.getByRole("link", { name: /nature docs/i })).toBeInTheDocument();

    // The empty state must NOT be showing.
    expect(screen.queryByText(/no categories yet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/can’t reach the api/i)).not.toBeInTheDocument();
  });

  it("shows the error + Retry panel when the API is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/can’t reach the api/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    expect(screen.queryByText(/no categories yet/i)).not.toBeInTheDocument();
  });
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
