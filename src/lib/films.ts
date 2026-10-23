import hero from "@/assets/hero.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

export type Film = {
  slug: string;
  title: string;
  director: string;
  year: number;
  genre: string;
  runtime: string;
  rating: string;
  poster: string;
  tagline: string;
  synopsis: string;
  cast: string[];
  status: "now" | "upcoming";
  release: string;
  laurels: string[];
  /** Hero carousel accent — text/UI color for this film's slide. */
  accent: string;
};

export const heroImage = hero;

export const films: Film[] = [
  {
    slug: "red-highway",
    title: "Red Highway",
    director: "Mara Kessel",
    year: 2026,
    genre: "Neo-Western",
    runtime: "1h 58m",
    rating: "R",
    poster: hero,
    tagline: "Some roads only go one way.",
    synopsis:
      "A drifter in a crimson coat walks the last highway out of a dying desert town, trailed by the ghosts of every deal he ever broke.",
    cast: ["Theo Vance", "Lina Ortiz", "Rufus Hale"],
    status: "now",
    release: "In theaters now",
    laurels: ["Cannes — Official Selection", "Best Cinematography, TIFF"],
    accent: "#E01B24",
  },
  {
    slug: "drown",
    title: "Drown",
    director: "Ines Haverkamp",
    year: 2026,
    genre: "Psychological Drama",
    runtime: "1h 44m",
    rating: "R",
    poster: p1,
    tagline: "Hold your breath.",
    synopsis:
      "A champion freediver begins hearing a voice beneath the surface — one that knows things about her she has never told anyone.",
    cast: ["Sasha Bloom", "Noah Ferrante"],
    status: "now",
    release: "In theaters now",
    laurels: ["Sundance — Grand Jury Prize"],
    accent: "#2DD4BF",
  },
  {
    slug: "blood-moon-farm",
    title: "Blood Moon Farm",
    director: "Caleb Wrenn",
    year: 2026,
    genre: "Horror",
    runtime: "1h 36m",
    rating: "R",
    poster: p2,
    tagline: "The harvest is coming.",
    synopsis:
      "Every thirty years the moon turns red over the Holloway farm, and every thirty years someone in town disappears.",
    cast: ["June Calder", "Pete Moreau", "Ada Sinclair"],
    status: "now",
    release: "Streaming now",
    laurels: ["Fantastic Fest — Audience Award"],
    accent: "#FB5607",
  },
  {
    slug: "blue-hour",
    title: "Blue Hour",
    director: "Dario Nakamura",
    year: 2025,
    genre: "Neo-Noir",
    runtime: "2h 07m",
    rating: "R",
    poster: p3,
    tagline: "Nobody's clean after midnight.",
    synopsis:
      "A disgraced detective works one last case through a city that never turns its neon off.",
    cast: ["Marcus Dahl", "Vera Lind"],
    status: "now",
    release: "Streaming now",
    laurels: ["Venice — Silver Lion"],
    accent: "#38BDF8",
  },
  {
    slug: "afterbloom",
    title: "Afterbloom",
    director: "Hana Oyelaran",
    year: 2027,
    genre: "Sci-Fi",
    runtime: "2h 12m",
    rating: "PG-13",
    poster: p4,
    tagline: "Paradise has a pulse.",
    synopsis:
      "The sole survivor of a failed colony mission wakes on a planet that seems to be growing just for her.",
    cast: ["Elio Brandt", "Mira Sato"],
    status: "upcoming",
    release: "Feb 14, 2027",
    laurels: ["Berlinale — Opening Film"],
    accent: "#E879F9",
  },
  {
    slug: "rooftop-summer",
    title: "Rooftop Summer",
    director: "Lou Archambault",
    year: 2027,
    genre: "Coming of Age",
    runtime: "1h 41m",
    rating: "R",
    poster: p5,
    tagline: "The last summer before everything.",
    synopsis:
      "Two runaways spend one endless August on the rooftops of a city that has forgotten them.",
    cast: ["Kit Reyes", "Odile Mars"],
    status: "upcoming",
    release: "Mar 27, 2027",
    laurels: ["SXSW — Official Selection"],
    accent: "#FBBF24",
  },
  {
    slug: "porcelain",
    title: "Porcelain",
    director: "Grete Solberg",
    year: 2027,
    genre: "Thriller",
    runtime: "1h 53m",
    rating: "R",
    poster: p6,
    tagline: "Everyone cracks.",
    synopsis:
      "An heiress hires a restorer to repair her mother's mask collection, and the masks begin to repair themselves.",
    cast: ["Isolde Crane", "Jonah Bey", "Rita Okafor"],
    status: "upcoming",
    release: "May 8, 2027",
    laurels: ["Coming soon"],
    accent: "#C084FC",
  },
];

export const getFilm = (slug: string) => films.find((f) => f.slug === slug);

export const news = [
  {
    id: 1,
    date: "Oct 18, 2026",
    tag: "Awards",
    title: "Drown takes the Grand Jury Prize",
    excerpt:
      "Ines Haverkamp's breathless debut wins big, becoming the studio's third Grand Jury winner in five years.",
    image: p1,
  },
  {
    id: 2,
    date: "Oct 09, 2026",
    tag: "Trailer",
    title: "First look: Afterbloom",
    excerpt:
      "The teaser for Hana Oyelaran's sci-fi epic lands with a soundtrack you'll be humming for weeks.",
    image: p4,
  },
  {
    id: 3,
    date: "Sep 30, 2026",
    tag: "Release",
    title: "Blood Moon Farm hits streaming",
    excerpt:
      "The midnight hit of the festival circuit is now streaming everywhere. Lock your doors.",
    image: p2,
  },
  {
    id: 4,
    date: "Sep 12, 2026",
    tag: "Studio",
    title: "We're acquiring Porcelain",
    excerpt:
      "Grete Solberg's cracked-glass thriller joins our 2027 slate after a fierce bidding war.",
    image: p6,
  },
  {
    id: 5,
    date: "Aug 28, 2026",
    tag: "Interview",
    title: "Dario Nakamura on shooting in the dark",
    excerpt: "The Blue Hour director explains why every frame was lit by real neon.",
    image: p3,
  },
];

export type Award = {
  id: string;
  festival: string;
  award: string;
  year: number;
  filmSlug: string;
  category: "Major Prize" | "Selection" | "Craft" | "Audience";
  citation: string;
};

export const awardsList: Award[] = [
  {
    id: "sundance-drown",
    festival: "Sundance Film Festival",
    award: "Grand Jury Prize — U.S. Dramatic",
    year: 2026,
    filmSlug: "drown",
    category: "Major Prize",
    citation:
      "Awarded for transcendent psychological depth, visceral sound design, and unmatched underwater cinematography.",
  },
  {
    id: "cannes-red-highway",
    festival: "Cannes Film Festival",
    award: "Official Selection — In Competition",
    year: 2026,
    filmSlug: "red-highway",
    category: "Selection",
    citation:
      "Selected for its unflinching neo-western vision and magnetic lead performance.",
  },
  {
    id: "tiff-red-highway",
    festival: "Toronto International Film Festival",
    award: "Best Cinematography Award",
    year: 2026,
    filmSlug: "red-highway",
    category: "Craft",
    citation:
      "Honored for breathtaking desert vistas bathed in anamorphic crimson illumination.",
  },
  {
    id: "venice-blue-hour",
    festival: "Venice International Film Festival",
    award: "Silver Lion — Grand Jury Prize",
    year: 2025,
    filmSlug: "blue-hour",
    category: "Major Prize",
    citation:
      "Recognized for reviving the neo-noir language with haunting contemporary precision.",
  },
  {
    id: "fantastic-blood-moon",
    festival: "Fantastic Fest",
    award: "Audience Award — Best Horror Feature",
    year: 2026,
    filmSlug: "blood-moon-farm",
    category: "Audience",
    citation:
      "Voted by attendees as the most gripping, heart-stopping midnight horror experience of the year.",
  },
  {
    id: "berlinale-afterbloom",
    festival: "Berlin International Film Festival",
    award: "Official Opening Film — Panorama",
    year: 2027,
    filmSlug: "afterbloom",
    category: "Selection",
    citation:
      "Chosen to open the festival for its visionary worldbuilding and groundbreaking visual scale.",
  },
  {
    id: "sxsw-rooftop-summer",
    festival: "SXSW Film Festival",
    award: "Official Selection — Narrative Spotlight",
    year: 2027,
    filmSlug: "rooftop-summer",
    category: "Selection",
    citation:
      "Celebrated as a kinetic, sun-drenched indie anthem capturing the bittersweet rush of youth.",
  },
];
