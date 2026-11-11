import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { getTrailerEmbedUrl, isDirectVideoUrl, type Film } from "@/lib/films";
import { ImagePicker, VideoPicker } from "@/pages/admin/ui";
import { TrailerModal } from "@/components/site";
import { HomePage } from "@/pages/home";

const contentMockState = vi.hoisted(() => ({
  films: null as Film[] | null,
}));

vi.mock("@/lib/content", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content")>();
  return {
    ...actual,
    useContent: () => {
      const base = actual.useContent();
      return contentMockState.films ? { ...base, films: contentMockState.films, awards: [], news: [] } : base;
    },
    useFilms: () => contentMockState.films ?? actual.useFilms(),
    useAwards: () => (contentMockState.films ? [] : actual.useAwards()),
    useFilmLookup: () => {
      const actualLookup = actual.useFilmLookup();
      return (slug: string) =>
        contentMockState.films ? contentMockState.films.find((f) => f.slug === slug) : actualLookup(slug);
    },
  };
});

const baseFilm: Film = {
  slug: "test-film",
  title: "Test Film",
  director: "Test Director",
  year: 2026,
  genre: "Drama",
  runtime: "1h 45m",
  rating: "PG-13",
  poster: "/images/films/hero.jpg",
  banner: "/uploads/hero-banner.jpg",
  still: "/uploads/still-frame.jpg",
  tagline: "Every frame holds a secret.",
  synopsis: "Test synopsis.",
  cast: ["Actor One"],
  status: "now",
  release: "2026",
  laurels: ["Festival Selection"],
  accent: "#7CFF3D",
};

describe("Video & trailer helpers", () => {
  it("recognizes direct MP4/WebM/MOV video URLs vs web links", () => {
    expect(isDirectVideoUrl("/uploads/123-trailer.mp4")).toBe(true);
    expect(isDirectVideoUrl("https://cdn.example.com/clip.webm?v=1")).toBe(true);
    expect(isDirectVideoUrl("https://res.cloudinary.com/demo/video/upload/v1/sample")).toBe(true);
    expect(isDirectVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(false);
    expect(isDirectVideoUrl("")).toBe(false);
  });

  it("extracts YouTube and Vimeo embed URLs cleanly", () => {
    expect(getTrailerEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(getTrailerEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0",
    );
    expect(getTrailerEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871?autoplay=1",
    );
    expect(getTrailerEmbedUrl("/uploads/local-trailer.mp4")).toBeNull();
  });
});

describe("Admin ImagePicker size detection & warnings", () => {
  it("shows recommended size and detects landscape mismatch inside portrait poster slot", () => {
    const onChange = vi.fn();
    render(
      <ImagePicker
        kind="poster"
        label="Theatrical Poster"
        value="/uploads/wide-banner.jpg"
        onChange={onChange}
        recommendedSize="1000 × 1500 px (2:3 portrait)"
      />,
    );

    expect(screen.getByText(/1000 × 1500 px \(2:3 portrait\)/i)).toBeInTheDocument();

    const imgs = document.querySelectorAll("img");
    const previewImg = imgs[0]!;
    Object.defineProperty(previewImg, "naturalWidth", { value: 2048, configurable: true });
    Object.defineProperty(previewImg, "naturalHeight", { value: 930, configurable: true });
    fireEvent.load(previewImg);

    expect(screen.getByText(/detected: 2048 × 930 px \(landscape\)/i)).toBeInTheDocument();
    expect(screen.getByText(/posters are vertical/i)).toBeInTheDocument();
  });

  it("shows green confirmation when wide artwork fits hero banner slot", () => {
    const onChange = vi.fn();
    render(
      <ImagePicker
        kind="banner"
        label="Hero Banner"
        value="/uploads/hero-wide.jpg"
        onChange={onChange}
      />,
    );

    const imgs = document.querySelectorAll("img");
    const previewImg = imgs[0]!;
    Object.defineProperty(previewImg, "naturalWidth", { value: 1920, configurable: true });
    Object.defineProperty(previewImg, "naturalHeight", { value: 1080, configurable: true });
    fireEvent.load(previewImg);

    expect(screen.getByText(/detected: 1920 × 1080 px \(landscape\)/i)).toBeInTheDocument();
    expect(screen.getByText(/ideal hero banner size/i)).toBeInTheDocument();
  });
});

describe("Admin VideoPicker (URL + MP4 Upload)", () => {
  it("renders URL input alongside Upload MP4 button and video player preview for MP4 uploads", () => {
    const onChange = vi.fn();
    render(<VideoPicker id="film-trailer" value="/uploads/promo-cut.mp4" onChange={onChange} />);

    expect(screen.getByRole("textbox", { name: /trailer url/i })).toHaveValue("/uploads/promo-cut.mp4");
    expect(screen.getByRole("button", { name: /upload mp4/i })).toBeInTheDocument();
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "/uploads/promo-cut.mp4");
  });

  it("detects YouTube URLs and displays embed badge", () => {
    const onChange = vi.fn();
    render(
      <VideoPicker
        id="film-trailer"
        value="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        onChange={onChange}
      />,
    );

    expect(screen.getByText(/valid youtube \/ vimeo embed detected/i)).toBeInTheDocument();
  });
});

describe("Public TrailerModal playback", () => {
  it("plays uploaded MP4 videos via HTML5 <video> when film.trailer is an MP4", () => {
    render(
      <TrailerModal
        film={{ ...baseFilm, trailer: "/uploads/golam-trailer.mp4" }}
        open
        onClose={vi.fn()}
      />,
    );
    const video = document.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("src", "/uploads/golam-trailer.mp4");
  });

  it("embeds YouTube player when film.trailer is a YouTube link", () => {
    render(
      <TrailerModal
        film={{ ...baseFilm, trailer: "https://youtu.be/dQw4w9WgXcQ" }}
        open
        onClose={vi.fn()}
      />,
    );
    const iframe = document.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
  });
});

describe("Coming Soon Poster (2:3) slot & exclusive Home showcase", () => {
  it("shows 2:3 Coming Soon normal poster size and warns on landscape vs confirms 1000×1500 portrait", () => {
    const onChange = vi.fn();
    render(
      <ImagePicker
        kind="coming-soon"
        label="Coming Soon Poster"
        value="/uploads/cs-poster.jpg"
        onChange={onChange}
      />,
    );

    expect(screen.getByText(/1000 × 1500 px \(2:3 poster\)/i)).toBeInTheDocument();

    const previewImg = document.querySelector("img")!;
    Object.defineProperty(previewImg, "naturalWidth", { value: 1920, configurable: true });
    Object.defineProperty(previewImg, "naturalHeight", { value: 1080, configurable: true });
    fireEvent.load(previewImg);

    expect(screen.getByText(/detected: 1920 × 1080 px \(landscape\)/i)).toBeInTheDocument();
    expect(screen.getByText(/coming soon stage uses a vertical normal poster frame/i)).toBeInTheDocument();

    Object.defineProperty(previewImg, "naturalWidth", { value: 1000, configurable: true });
    Object.defineProperty(previewImg, "naturalHeight", { value: 1500, configurable: true });
    fireEvent.load(previewImg);

    expect(screen.getByText(/detected: 1000 × 1500 px \(portrait\)/i)).toBeInTheDocument();
    expect(screen.getByText(/great 2:3 coming soon poster fit \(1000 × 1500 px\)/i)).toBeInTheDocument();
  });

  it("renders comingSoonBanner exclusively in the Home Coming soon normal poster container", () => {
    const upcomingFilm: Film = {
      ...baseFilm,
      slug: "upcoming-exclusive-test",
      title: "Upcoming Exclusive Film",
      status: "upcoming",
      featured: true,
      poster: "/uploads/upcoming-poster.jpg",
      banner: "/uploads/upcoming-hero.jpg",
      still: "/uploads/upcoming-still.jpg",
      comingSoonBanner: "/uploads/upcoming-coming-soon-only.jpg",
      trailer: "https://youtu.be/dQw4w9WgXcQ",
    };

    contentMockState.films = [baseFilm, upcomingFilm];
    try {
      const { container } = render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>,
      );

      const comingSoonSection = screen
        .getAllByText(/^coming soon$/i)
        .map((el) => el.closest("section"))
        .find((sec) => sec?.classList.contains("theme-dark") && !sec.classList.contains("h-[100svh]"));
      expect(comingSoonSection).toBeDefined();

      const posterStage = comingSoonSection!.querySelector(".aspect-\\[2\\/3\\]");
      expect(posterStage).not.toBeNull();
      expect(posterStage).toHaveClass("max-w-[380px]", "lg:max-w-[400px]");

      const csImg = within(comingSoonSection!).getByAltText("Upcoming Exclusive Film");
      expect(csImg).toHaveAttribute("src", "/uploads/upcoming-coming-soon-only.jpg");
      Object.defineProperty(csImg, "naturalWidth", { value: 1000, configurable: true });
      Object.defineProperty(csImg, "naturalHeight", { value: 1500, configurable: true });
      fireEvent.load(csImg);
      expect(csImg).toHaveClass("object-cover");
      expect(csImg).not.toHaveClass("object-contain");

      const allImgsWithComingSoon = Array.from(container.querySelectorAll("img")).filter(
        (img) => img.getAttribute("src") === "/uploads/upcoming-coming-soon-only.jpg",
      );
      expect(allImgsWithComingSoon.length).toBeGreaterThan(0);
      expect(allImgsWithComingSoon.every((img) => comingSoonSection!.contains(img))).toBe(true);
    } finally {
      contentMockState.films = null;
    }
  });
});

