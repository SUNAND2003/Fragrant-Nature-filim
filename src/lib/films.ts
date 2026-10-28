import hero from "@/assets/hero.jpg";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";

/** Populated `{_id,name,slug}` reference returned by the API. */
export type RefDoc = { _id: string; name: string; slug: string };

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  accent?: string;
  order?: number;
};

export type Subcategory = {
  _id: string;
  name: string;
  slug: string;
  category: RefDoc | null;
  order?: number;
};

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
  /** Mongo id — present when the film comes from the API. */
  _id?: string;
  /** Hero carousel membership (API only; static data treats every film as featured). */
  featured?: boolean;
  /** Trailer watch URL shown on the film page / trailer modal. */
  trailer?: string;
  order?: number;
  category?: RefDoc | null;
  subcategories?: RefDoc[];
};

export type GalleryImage = {
  _id?: string;
  url: string;
  caption?: string;
  order?: number;
};

export type GalleryItem = {
  _id: string;
  filmTitle: string;
  filmSlug: string;
  genre?: string;
  year?: number;
  poster?: string;
  images: GalleryImage[];
  order: number;
  visible: boolean;
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

export type NewsArticle = {
  /** Mongo id — present when the article comes from the API. */
  _id?: string;
  id: number;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
  author: string;
  readTime: string;
  filmSlug?: string;
  content: string[];
  quote?: { text: string; author: string };
  /** API only: drafts are hidden from the public feed. */
  published?: boolean;
};

export const news: NewsArticle[] = [
  {
    id: 1,
    date: "Oct 18, 2026",
    tag: "Awards",
    title: "Drown takes the Grand Jury Prize",
    excerpt:
      "Ines Haverkamp's breathless debut wins big, becoming the studio's third Grand Jury winner in five years.",
    image: p1,
    author: "Claire Moreau",
    readTime: "4 min read",
    filmSlug: "drown",
    content: [
      "In a triumphant ceremony that capped ten days of cinema in Park City, Ines Haverkamp's psychological masterpiece 'Drown' was awarded the prestigious Grand Jury Prize in the U.S. Dramatic Competition.",
      "The jury praised the film for its uncompromising sensory tension, visceral underwater camera work, and an astonishing lead performance by Astrid Lindholm that holds viewers in a vice grip from the opening shot to its haunting final frame.",
      "'We wanted to make a movie that didn't just tell a story, but physically submerged the audience in the psychological disorientation of guilt,' Haverkamp shared in her acceptance speech. 'To have this story recognized at this level by fellow filmmakers is beyond anything we could have hoped for.'",
      "The victory cements Fragrant Nature's third Grand Jury honor in five seasons, underscoring the studio's enduring commitment to risk-tolerant, director-driven visions that challenge festival orthodoxy.",
    ],
    quote: {
      text: "We wanted to make a movie that physically submerged the audience in the psychological disorientation of guilt.",
      author: "Ines Haverkamp, Director",
    },
  },
  {
    id: 2,
    date: "Oct 09, 2026",
    tag: "Trailer",
    title: "First look: Afterbloom",
    excerpt:
      "The teaser for Hana Oyelaran's sci-fi epic lands with a soundtrack you'll be humming for weeks.",
    image: p4,
    author: "Marcus Chen",
    readTime: "3 min read",
    filmSlug: "afterbloom",
    content: [
      "Fragrant Nature has officially unveiled the hypnotic first teaser trailer for Hana Oyelaran's visionary sci-fi epic 'Afterbloom', set for international theatrical release on Valentine's Day 2027.",
      "Shot across the volcanic landscapes of Iceland and the Atacama Desert on large-format 65mm celluloid, the teaser offers audiences their first glimpse of an alien biosphere that awakens and mutates in direct response to human consciousness.",
      "The teaser has already ignited viral conversation online for its ethereal ambient score composed by avant-garde cellist Elio Brandt, who spent three months sampling natural acoustic resonances in subterranean ice caves to build the film's sonic vocabulary.",
    ],
    quote: {
      text: "Sci-fi often treats alien worlds as empty combat zones. In Afterbloom, the planet is an empathetic organism that remembers everything.",
      author: "Hana Oyelaran, Director",
    },
  },
  {
    id: 3,
    date: "Sep 30, 2026",
    tag: "Release",
    title: "Blood Moon Farm hits streaming",
    excerpt:
      "The midnight hit of the festival circuit is now streaming everywhere. Lock your doors.",
    image: p2,
    author: "Zoe Kravitz",
    readTime: "3 min read",
    filmSlug: "blood-moon-farm",
    content: [
      "Following a sold-out international midnight tour that saw festival audiences audibly gasping in cinemas from Sitges to Toronto, Toby Vance's folk-horror phenomenon 'Blood Moon Farm' is now available to stream globally.",
      "The film, which holds a 96% critics rating, reimagines rural terror through tactile 16mm grain, eerie ritualistic folklore, and an unhurried dread that culminates in one of the most talked-about third acts in recent independent horror.",
      "A limited-edition gatefold vinyl of the film's folk soundtrack and high-res screenprinted theatrical posters have also launched exclusively in the Fragrant Nature studio store.",
    ],
    quote: {
      text: "True horror lives in the silence between people who have known each other for fifty years and suddenly realize they are strangers.",
      author: "Toby Vance, Director",
    },
  },
  {
    id: 4,
    date: "Sep 12, 2026",
    tag: "Studio",
    title: "We're acquiring Porcelain",
    excerpt:
      "Grete Solberg's cracked-glass thriller joins our 2027 slate after a fierce bidding war.",
    image: p6,
    author: "Studio Editorial",
    readTime: "2 min read",
    filmSlug: "porcelain",
    content: [
      "Fragrant Nature has acquired worldwide distribution rights to Grete Solberg's high-stakes psychological thriller 'Porcelain' following an intense multi-studio bidding war at the Toronto International Film Festival.",
      "Starring Isolde Crane alongside Jonah Bey and Rita Okafor, the film explores an eccentric heiress who hires a master restorer to mend an inherited ancestral mask collection — only to discover that the cracked porcelain is mysteriously healing itself overnight.",
      "'Grete's script was the most electric, unsettling piece of storytelling we encountered all year,' said studio co-founder Julian Croft. 'We are thrilled to bring her uncompromising vision to theater screens worldwide in May 2027.'",
    ],
    quote: {
      text: "Fragrant Nature is the only distributor that didn't ask me to soften the ending. They understood immediately that the dread had to be total.",
      author: "Grete Solberg, Director",
    },
  },
  {
    id: 5,
    date: "Aug 28, 2026",
    tag: "Interview",
    title: "Dario Nakamura on shooting in the dark",
    excerpt: "The Blue Hour director explains why every frame was lit by real neon.",
    image: p3,
    author: "Arlo Finch",
    readTime: "5 min read",
    filmSlug: "blue-hour",
    content: [
      "In an expansive behind-the-scenes conversation, director Dario Nakamura breaks down the rigorous technical methodology behind 'Blue Hour', his neo-noir crime thriller set across the midnight alleyways of Shinjuku and Hong Kong.",
      "Nakamura and cinematographer Kenjiro Mori made the radical creative choice to eschew modern studio LED film lights entirely, lighting every single sequence exclusively with practical vintage neon fixtures, sodium streetlamps, and rainy asphalt reflections.",
      "'When you use artificial studio lighting to simulate night, you lose the honesty of the dark,' Nakamura reflects. 'We wanted the shadows to swallow the characters, and the only salvation to come from glowing tubes of argon and neon gas.'",
    ],
    quote: {
      text: "When you use artificial studio lighting to simulate night, you lose the honesty of the dark. We wanted the shadows to swallow the characters.",
      author: "Dario Nakamura, Director",
    },
  },
];

export const getNews = (id: string | number) => news.find((n) => String(n.id) === String(id));

export type Award = {
  /** Mongo id — present when the honor comes from the API; `id` stays the public key. */
  _id?: string;
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
    citation: "Selected for its unflinching neo-western vision and magnetic lead performance.",
  },
  {
    id: "tiff-red-highway",
    festival: "Toronto International Film Festival",
    award: "Best Cinematography Award",
    year: 2026,
    filmSlug: "red-highway",
    category: "Craft",
    citation: "Honored for breathtaking desert vistas bathed in anamorphic crimson illumination.",
  },
  {
    id: "venice-blue-hour",
    festival: "Venice International Film Festival",
    award: "Silver Lion — Grand Jury Prize",
    year: 2025,
    filmSlug: "blue-hour",
    category: "Major Prize",
    citation: "Recognized for reviving the neo-noir language with haunting contemporary precision.",
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
