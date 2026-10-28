import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  ArrowRight,
  CheckCircle2,
  Send,
  Building2,
  FileText,
  Sparkles,
} from "lucide-react";

import { usePageMeta } from "@/lib/use-page-meta";
import { PageTitle, Reveal } from "@/components/site";
import { heroImage } from "@/lib/films";

const INQUIRY_CATEGORIES = [
  { id: "general", label: "General Inquiries", email: "studio@fragrantnaturefilms.com" },
  {
    id: "distribution",
    label: "Theatrical & Distribution",
    email: "distribution@fragrantnaturefilms.com",
  },
  { id: "press", label: "Press & Festivals", email: "press@fragrantnaturefilms.com" },
  {
    id: "submissions",
    label: "Filmmaker Submissions",
    email: "submissions@fragrantnaturefilms.com",
  },
  {
    id: "screenings",
    label: "Special Screenings & Bookings",
    email: "events@fragrantnaturefilms.com",
  },
] as const;

type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number]["id"];

const LOCATIONS = [
  {
    city: "Brooklyn",
    tag: "Headquarters & Post-Production",
    address: "42 Water Street, Suite 400",
    region: "DUMBO, Brooklyn, NY 11201",
    country: "United States",
    tel: "+1 (718) 555-0192",
    hours: "Mon – Fri: 09:00 – 18:00 EST",
  },
  {
    city: "London",
    tag: "European Sales & Acquisitions",
    address: "14 Soho Square, Floor 3",
    region: "Soho, London W1D 3QG",
    country: "United Kingdom",
    tel: "+44 20 7946 0912",
    hours: "Mon – Fri: 09:30 – 18:30 GMT",
  },
  {
    city: "Kochi",
    tag: "South Asia Production Hub",
    address: "Old Harbour Road, Suite 12",
    region: "Fort Kochi, Kerala 682001",
    country: "India",
    tel: "+91 484 221 6800",
    hours: "Mon – Fri: 10:00 – 19:00 IST",
  },
];

const GUIDELINES = [
  {
    title: "Unsolicited Screenplays",
    desc: "For legal reasons, Fragrant Nature cannot review unsolicited creative materials without representation by an accredited agent, manager, or entertainment attorney.",
  },
  {
    title: "Festival Screeners & Programmers",
    desc: "Festival selectors and programmers can request digital screeners with watermarked screener passes by emailing press@fragrantnaturefilms.com with credentials.",
  },
  {
    title: "Repertory & Independent Theaters",
    desc: "We support single-screen, repertory, and college cinema bookings with 35mm and DCP packages. Reach out to distribution@fragrantnaturefilms.com.",
  },
];

export function ContactPage() {
  usePageMeta({
    title: "Contact & Bureaus — Fragrant Nature",
    description:
      "Get in touch with Fragrant Nature Film Productions. Studio headquarters, distribution, press, and filmmaker inquiries.",
  });

  const [category, setCategory] = useState<InquiryCategory>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");

  const activeCategoryMeta = INQUIRY_CATEGORIES.find((c) => c.id === category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    // Simulate swift server transmission
    setTimeout(() => {
      const randomTicket = "FN-" + Math.floor(100000 + Math.random() * 900000);
      setRefId(randomTicket);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setMessage("");
    setSubmitted(false);
  };

  return (
    <>
      <PageTitle eyebrow="Bureaus & Direct Lines" title="Get In" outline="Touch" small />

      {/* Atmospheric Cinematic Banner */}
      <section className="mx-auto max-w-[1600px] px-5 pb-16 md:px-10">
        <div className="relative aspect-[21/7] min-h-[220px] w-full overflow-hidden rounded-2xl bg-black md:aspect-[21/6]">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className="kenburns h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
            <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
              Global Communications
            </p>
            <p className="mt-2 max-w-2xl font-display text-2xl text-white md:text-4xl">
              We welcome dialogue with bold storytellers, theatrical partners, and press worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid: Form on Left, Direct Contact / Bureaus on Right */}
      <section className="mx-auto max-w-[1600px] px-5 pb-24 md:px-10">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Left Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <Reveal>
              <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur-sm sm:p-10 md:p-12">
                <div className="mb-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-tight text-neon-ink">
                    <Sparkles className="h-3 w-3" /> Transmit Dispatch
                  </span>
                  <h2 className="mt-4 font-display text-3xl md:text-5xl">Send a Message</h2>
                  <p className="mt-2 text-sm text-muted-foreground md:text-base">
                    Select the inquiry category that best matches your request to route directly to
                    the relevant department desk.
                  </p>
                </div>

                {/* Inquiry Category Pills */}
                <div className="mb-8">
                  <label className="mb-3 block font-sans text-xs font-bold uppercase tracking-tight text-muted-foreground">
                    Select Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INQUIRY_CATEGORIES.map((cat) => {
                      const selected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          aria-pressed={selected}
                          className={`rounded-full border px-4 py-2 font-sans text-xs font-bold uppercase tracking-tight transition-all duration-200 ${
                            selected
                              ? "border-neon bg-neon text-primary-foreground shadow-sm"
                              : "border-border bg-background/50 text-foreground/80 hover:border-foreground hover:text-foreground"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                  {activeCategoryMeta && (
                    <p className="mt-2.5 font-mono text-xs text-muted-foreground">
                      Direct mailbox:{" "}
                      <a
                        href={`mailto:${activeCategoryMeta.email}`}
                        className="text-neon-ink underline hover:opacity-80"
                      >
                        {activeCategoryMeta.email}
                      </a>
                    </p>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="rounded-2xl border border-border bg-background p-8 text-center"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neon/20 text-neon-ink">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <h3 className="mt-5 font-display text-2xl md:text-3xl">
                        Dispatch Transmitted
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        Thank you, <span className="font-semibold text-foreground">{name}</span>.
                        Your message has been delivered to our{" "}
                        <span className="font-semibold text-foreground">
                          {activeCategoryMeta?.label}
                        </span>{" "}
                        desk.
                      </p>
                      <div className="mt-6 inline-block rounded-lg border border-border bg-muted/40 px-4 py-2 font-mono text-xs">
                        Reference Ticket: <span className="text-neon-ink font-bold">{refId}</span>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Our typical response window is 24–48 hours during business days.
                      </p>
                      <div className="mt-8">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="rounded-full border border-foreground px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-tight text-foreground transition-colors hover:border-neon hover:bg-neon hover:text-primary-foreground"
                        >
                          Send Another Message
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleSubmit}
                      className="space-y-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="contact-name"
                            className="mb-2 block font-sans text-xs font-bold uppercase tracking-tight text-foreground"
                          >
                            Your Name <span className="text-accent">*</span>
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Maya Lin"
                            className="w-full rounded-xl border border-border bg-background px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="contact-email"
                            className="mb-2 block font-sans text-xs font-bold uppercase tracking-tight text-foreground"
                          >
                            Email Address <span className="text-accent">*</span>
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. maya@cinema.com"
                            className="w-full rounded-xl border border-border bg-background px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-company"
                          className="mb-2 block font-sans text-xs font-bold uppercase tracking-tight text-foreground"
                        >
                          Production Company / Outlet{" "}
                          <span className="text-xs text-muted-foreground font-normal">
                            (Optional)
                          </span>
                        </label>
                        <input
                          id="contact-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Midnight Horizon Pictures"
                          className="w-full rounded-xl border border-border bg-background px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="contact-message"
                          className="mb-2 block font-sans text-xs font-bold uppercase tracking-tight text-foreground"
                        >
                          Message <span className="text-accent">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          required
                          rows={5}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Briefly state your inquiry, project title, or screening request..."
                          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:border-neon focus:outline-none focus:ring-1 focus:ring-neon"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="group relative inline-flex w-full items-center justify-center gap-3 rounded-full bg-neon px-8 py-4 font-sans text-xs font-bold uppercase tracking-tight text-primary-foreground transition-all duration-300 hover:opacity-90 disabled:opacity-50 sm:w-auto"
                        >
                          {isSubmitting ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                              <span>Transmitting...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              <span>Send Dispatch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          </div>

          {/* Right Column: Direct Department Directory & Bureaus (5 cols) */}
          <div className="space-y-12 lg:col-span-5">
            {/* Quick Departments */}
            <Reveal delay={0.1}>
              <div>
                <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                  Direct Inquiries Directory
                </p>
                <h3 className="mt-3 font-display text-2xl md:text-3xl">Department Contacts</h3>
                <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card/40">
                  {INQUIRY_CATEGORIES.map((cat) => (
                    <div key={cat.id} className="p-4 sm:p-5 transition-colors hover:bg-card">
                      <p className="font-sans text-xs font-bold uppercase tracking-tight text-foreground">
                        {cat.label}
                      </p>
                      <a
                        href={`mailto:${cat.email}`}
                        className="mt-1 flex items-center gap-2 font-mono text-xs text-neon-ink hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>{cat.email}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Press Kit & Assets Card */}
            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-card/50 p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neon/10 text-neon-ink">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-sm font-bold uppercase tracking-tight text-foreground">
                      Press Kit & Brand Assets
                    </h4>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      Download our official studio logos, film one-sheets, production stills, and
                      high-res festival laurel kits.
                    </p>
                    <Link
                      to="/gallery"
                      className="mt-3 inline-flex items-center gap-1.5 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink hover:underline"
                    >
                      <span>Explore Gallery & Stills</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Global Studio Bureaus Section */}
      <section className="theme-dark border-t border-border bg-background py-24 text-foreground">
        <div className="mx-auto max-w-[1600px] px-5 md:px-10">
          <div className="mb-14">
            <p className="font-sans text-xs font-bold uppercase tracking-tight text-accent">
              Physical Stages & Bureaus
            </p>
            <h2 className="mt-3 font-display text-4xl md:text-6xl">Studio Locations</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Production offices, screening lounges, and development suites across three continents.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {LOCATIONS.map((loc, i) => (
              <Reveal key={loc.city} delay={i * 0.1}>
                <div className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-neon/50 sm:p-8">
                  <div>
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <span className="font-display text-3xl text-foreground group-hover:text-neon-ink transition-colors">
                        {loc.city}
                      </span>
                      <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-neon-ink transition-colors" />
                    </div>
                    <p className="mt-4 font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
                      {loc.tag}
                    </p>

                    <div className="mt-6 space-y-3.5 text-sm">
                      <div className="flex items-start gap-3 text-muted-foreground">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <div>
                          <p>{loc.address}</p>
                          <p>{loc.region}</p>
                          <p className="font-semibold text-foreground/90">{loc.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0 text-foreground" />
                        <a
                          href={`tel:${loc.tel.replace(/[^+\d]/g, "")}`}
                          className="hover:text-foreground transition-colors"
                        >
                          {loc.tel}
                        </a>
                      </div>

                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0 text-foreground" />
                        <span>{loc.hours}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Guidelines & Policies Accordion / Cards */}
      <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-10">
        <div className="mb-12">
          <p className="font-sans text-xs font-bold uppercase tracking-tight text-neon-ink">
            Policy & Best Practices
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-5xl">Submission & Licensing Notes</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {GUIDELINES.map((item, idx) => (
            <Reveal key={item.title} delay={idx * 0.08}>
              <div className="h-full rounded-2xl border border-border bg-card/40 p-6 sm:p-8">
                <span className="font-mono text-xs font-bold text-neon-ink">0{idx + 1}</span>
                <h3 className="mt-3 font-display text-xl text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
