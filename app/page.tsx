"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import BookingFlow, { Arrow, PlaceField } from "./components/BookingFlow";
import {
  ArrowRight,
  ArrowUpRight,
  Building,
  Clock,
  CreditCard,
  MapPin,
  Mountain,
  Plane,
  Shield,
  Sparkles,
  Star,
} from "./components/Icons";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const services = [
  ["01", "Airport transfers", "Punctual, quiet terminal meet & assist at Sky Harbor (PHX) and Mesa Gateway (AZA). Flight tracking included."],
  ["02", "Corporate travel", "Composed, discreet executive travel for CEOs, board members, visiting partners, and teams."],
  ["03", "Hourly chauffeur", "A dedicated luxury vehicle and professional chauffeur at your beck and call around your agenda."],
  ["04", "Events & evenings", "Gala celebrations, fine dining, concerts, and private social occasions—handled with sophistication."],
  ["05", "Point to point", "Private door-to-door transportation across Scottsdale, Paradise Valley, Phoenix, and the Valley."],
  ["06", "Arizona journeys", "Sedona, Grand Canyon, Tucson, and custom statewide itineraries available by personal quote."],
];

const valleyDestinations = [
  { name: "Phoenix Sky Harbor (PHX)", driveTime: "Direct Airport Access" },
  { name: "Old Town Scottsdale", driveTime: "15 min from PHX" },
  { name: "Paradise Valley Resorts", driveTime: "20 min from PHX" },
  { name: "Camelback Mountain", driveTime: "18 min from PHX" },
  { name: "The Phoenician & Biltmore", driveTime: "16 min from PHX" },
  { name: "Mesa Gateway (AZA)", driveTime: "30 min from PHX" },
];

const chauffeurs = [
  {
    name: "Marshal Matimba",
    role: "Senior Executive Chauffeur",
    experience: "11+ Years in Phoenix & Scottsdale",
    certification: "Defensive Driving & First Aid Certified",
    bio: "Specializing in corporate executive transport and PHX airport arrivals. Fluent in English and Spanish with extensive knowledge of private resorts and Valley shortcuts.",
    initials: "MV",
  },
  // {
  //   name: "Sophia Reyes",
  //   role: "Airport & Private Event Specialist",
  //   experience: "10+ Years Executive Chauffeur Service",
  //   certification: "Terminal Flight Tracking & VIP Protocol",
  //   bio: "Renowned for flawless punctuality and serene cabin atmosphere during early morning airport transfers and high-profile evening galas.",
  //   initials: "SR",
  // },
  // {
  //   name: "David Sterling",
  //   role: "Statewide & Hourly Charter Specialist",
  //   experience: "12+ Years Long-Distance Charter",
  //   certification: "Advanced Mountain & Highway Navigation",
  //   bio: "Expert in long-distance Arizona charters (Sedona, Tucson, Grand Canyon) and multi-stop corporate agendas across the Valley.",
  //   initials: "DS",
  // },
];

const clientReviews = [
  {
    quote: "Permanence Exclusive is our default chauffeur recommendation for C-suite visitors arriving at Sky Harbor. The flight tracking and quiet cabin standard are flawless.",
    author: "Richard Montgomery",
    title: "Managing Director, Tech Ventures",
    trip: "Airport Transfer · Executive SUV",
  },
  {
    quote: "Used their hourly service for a day of resort meetings in Paradise Valley and dinner in Old Town. Marcus was early, professional, and kept the climate perfect.",
    author: "Elena Rostova",
    title: "Event Director",
    trip: "Hourly Chauffeur · Luxury Sedan",
  },
  {
    quote: "Booked a private trip up to Sedona for a weekend getaway. Seamless process, zero surge pricing surprises, and exceptionally comfortable ride.",
    author: "Dr. Jonathan Hayes",
    title: "Valley Resident",
    trip: "Arizona Journey · Private Sedan",
  },
];

function FiveStars() {
  return (
    <div className="review-stars" role="img" aria-label="Rated 5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={15} />)}
    </div>
  );
}

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);
  const [bookServiceName, setBookServiceName] = useState<string | null>(null);
  const [bookPickup, setBookPickup] = useState<string | null>(null);
  const [bookDropoff, setBookDropoff] = useState<string | null>(null);
  const [heroPickup, setHeroPickup] = useState<string>("");
  const [heroDropoff, setHeroDropoff] = useState<string>("");
  const [heroError, setHeroError] = useState<string>("");

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Hero entrance
      const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
      entrance
        .from(".hero-image", { scale: 1.14, duration: 2.6, ease: "power2.out" }, 0)
        .from(".hero .eyebrow", { y: 26, autoAlpha: 0, duration: 0.7 }, 0.15)
        .from(".hero h1 .hero-line", { y: 60, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0.3)
        .from(".hero-copy", { y: 24, autoAlpha: 0, duration: 0.7 }, 0.6)
        .from(".hero-quick-bar", { y: 24, autoAlpha: 0, duration: 0.7 }, 0.75)
        .from(".hero-shortcuts", { y: 16, autoAlpha: 0, duration: 0.6 }, 0.9)
        .from(".hero-actions", { y: 16, autoAlpha: 0, duration: 0.6 }, 1)
        .from(".hero-badge-pill", { autoAlpha: 0, duration: 0.8, stagger: 0.15 }, 0.9)
        .from(".hero-index", { autoAlpha: 0, duration: 0.6 }, 1.2);

      // Subtle hero parallax
      gsap.to(".hero-image", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
      });

      // Nav solidifies after leaving the hero top
      ScrollTrigger.create({
        start: 40,
        end: "max",
        toggleClass: { targets: ".nav", className: "scrolled" },
      });

      // Scroll reveals
      gsap.set("[data-reveal]", { autoAlpha: 0, y: 30 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (elements) =>
          gsap.to(elements, {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            stagger: 0.09,
            overwrite: true,
          }),
      });
    });
  }, { scope: mainRef });

  function bookService(service: string) {
    setBookServiceName(service);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleHeroQuickQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!heroPickup.trim()) {
      setHeroError("Enter a pickup location to continue.");
      return;
    }
    if (!heroDropoff.trim()) {
      setHeroError("Enter a destination to continue.");
      return;
    }
    setHeroError("");
    setBookPickup(heroPickup.trim());
    setBookDropoff(heroDropoff.trim());
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main ref={mainRef}>
      <header className="nav">
        <a className="wordmark" href="#top" aria-label="Permanence Exclusive home">
          <strong>PERMANENCE</strong>
          <span>EXCLUSIVE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#services">Services</a>
          <a href="#chauffeurs">Chauffeurs</a>
          <a href="#experience">Experience</a>
          <a href="#coverage">Destinations</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <a className="nav-book" href="#book">Book Your Ride <Arrow /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />

        <div className="hero-content">
          <p className="eyebrow">
            <span className="eyebrow-full">Private Chauffeur Service · Arizona Valley</span>
            <span className="eyebrow-short">Private Chauffeur · Arizona</span>
          </p>
          <h1>
            <span className="hero-line">Your journey.</span><br />
            <span className="hero-line"><em>Elevated.</em></span>
          </h1>
          <p className="hero-copy">
            Private, prearranged luxury transportation across Phoenix, Scottsdale, and Paradise Valley. Tailored precisely around your agenda.
          </p>

          <form className="hero-quick-bar" onSubmit={handleHeroQuickQuote}>
            <PlaceField
              variant="hero"
              label="Pickup"
              value={heroPickup}
              onChange={(value) => {
                setHeroPickup(value);
                if (heroError) setHeroError("");
              }}
              placeholder="PHX Airport, Resort, or Address"
            />
            <div className="hero-quick-divider" aria-hidden="true"><ArrowRight size={16} /></div>
            <PlaceField
              variant="hero"
              label="Destination"
              value={heroDropoff}
              onChange={(value) => {
                setHeroDropoff(value);
                if (heroError) setHeroError("");
              }}
              placeholder="Where are you going?"
            />
            <button type="submit" className="hero-quick-submit">
              Get Estimate <Arrow />
            </button>
          </form>
          {heroError ? <p className="hero-quick-error" role="alert">{heroError}</p> : null}

          <div className="hero-shortcuts">
            <span>Popular:</span>
            <button type="button" onClick={() => { setHeroPickup("Phoenix Sky Harbor (PHX)"); setHeroDropoff("Old Town Scottsdale"); setHeroError(""); }}>
              <Plane size={13} /> PHX → Scottsdale
            </button>
            <button type="button" onClick={() => { setHeroPickup("Paradise Valley Resort"); setHeroDropoff("Phoenix Sky Harbor (PHX)"); setHeroError(""); }}>
              <Building size={13} /> Resort → Airport
            </button>
            <button type="button" onClick={() => { setHeroPickup("Scottsdale"); setHeroDropoff("Sedona, AZ"); setHeroError(""); }}>
              <Mountain size={13} /> Sedona Charter
            </button>
          </div>

          <div className="hero-actions">
            <a className="button light" href="#book">Reserve Your Chauffeur <Arrow /></a>
            <a className="text-link" href="#services">Explore Services <Arrow down /></a>
          </div>
        </div>

        <div className="hero-floating-badges" aria-hidden="true">
          <div className="hero-badge-pill">
            <i><Plane size={20} /></i>
            <div>
              <strong>Sky Harbor Tracking</strong>
              <span>Real-Time Flight Gate Monitoring</span>
            </div>
          </div>
          <div className="hero-badge-pill">
            <i><Clock size={20} /></i>
            <div>
              <strong>On-Time Guarantee</strong>
              <span>Prearranged Executive Drivers</span>
            </div>
          </div>
          <div className="hero-badge-pill">
            <i><Sparkles size={20} /></i>
            <div>
              <strong>Executive Amenities</strong>
              <span>Chilled Water & Rear Climate Control</span>
            </div>
          </div>
        </div>

        <div className="hero-index" aria-hidden="true"><span>01</span><i /></div>
      </section>

      <section className="booking-section" id="book">
        <div className="section-heading" data-reveal>
          <p className="eyebrow dark">Reserve Your Ride</p>
          <h2>A better way<br />to move.</h2>
          <p>Tell us where you’re going. Instant fare calculation, visual route preview, and tailored cabin preferences built right in.</p>
        </div>
        <BookingFlow
          initialService={bookServiceName}
          initialPickup={bookPickup}
          initialDestination={bookDropoff}
          onServiceConsumed={() => setBookServiceName(null)}
          onTripConsumed={() => {
            setBookPickup(null);
            setBookDropoff(null);
          }}
        />
      </section>

      <section className="trust-strip" aria-label="Service qualities">
        <span data-reveal><Shield size={16} /> Vetted Executive Chauffeurs</span>
        <span data-reveal><Plane size={16} /> Real-Time Flight Tracking</span>
        <span data-reveal><CreditCard size={16} /> Upfront Guaranteed Fares</span>
        <span data-reveal><MapPin size={16} /> Arizona Statewide Coverage</span>
      </section>

      <section className="manifesto" id="experience">
        <p className="eyebrow" data-reveal>The Permanence Standard</p>
        <p className="manifesto-copy" data-reveal>
          This is not simply a ride.<br />
          It is the space between <em>where you are</em><br />
          and <em>what comes next.</em>
        </p>
        <div className="manifesto-aside" data-reveal>
          <p>
            Calm, considered, and entirely personalized. Every detail—from cabin temperature to refreshment preferences—is prearranged so you arrive with absolute confidence.
          </p>
          <a href="#services">Explore Services <Arrow /></a>
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading services-heading" data-reveal>
          <p className="eyebrow dark">Tailored Travel</p>
          <h2>Services,<br /><em>considered.</em></h2>
        </div>
        <div className="service-list">
          {services.map(([number, title, copy]) => (
            <article key={number} data-reveal>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <button onClick={() => bookService(title)} aria-label={`Book ${title}`}>
                Reserve <ArrowUpRight size={13} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="chauffeur-section" id="chauffeurs">
        <div className="section-heading" data-reveal>
          <p className="eyebrow dark">The Human Touch</p>
          <h2>Meet Our<br /><em>Chauffeurs.</em></h2>
          <p>Professional, background-checked, and impeccably presented. Our drivers bring decades of local Valley mastery and executive courtesy.</p>
        </div>
        <div className="chauffeur-grid">
          {chauffeurs.map((c) => (
            <div className="chauffeur-card" key={c.name} data-reveal>
              <div className="chauffeur-avatar">{c.initials}</div>
              <h3>{c.name}</h3>
              <div className="chauffeur-badge">{c.role}</div>
              <p className="chauffeur-meta">{c.experience} · {c.certification}</p>
              <p>{c.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fleet-panel">
        <div className="fleet-copy" data-reveal>
          <p className="eyebrow">The Fleet</p>
          <h2>Quiet luxury.<br />Impeccably kept.</h2>
          <p>
            Our fleet features handpicked executive luxury sedans and full-size SUVs selected for whisper-quiet ride comfort, spacious legroom, and refined presence.
          </p>
          <div className="fleet-specs">
            <span><strong>Up to 6</strong> passengers</span>
            <span><strong>Dual Climate</strong> controlled</span>
            <span><strong>Mineral Water</strong> & Wi-Fi</span>
          </div>
        </div>
        <div className="fleet-visual" role="img" aria-label="Executive black sedan at a luxury Arizona residence" />
      </section>

      <section className="coverage" id="coverage">
        <div data-reveal>
          <p className="eyebrow dark">Arizona Valley Destinations</p>
          <h2>From Sky Harbor,<br />to anywhere.</h2>
        </div>
        <div className="coverage-copy" data-reveal>
          <p>Prearranged private luxury travel throughout Phoenix, Scottsdale, Paradise Valley, and beyond. Statewide custom charters welcomed.</p>
          <div className="city-grid">
            {valleyDestinations.map((dest) => (
              <span key={dest.name}>
                <span>{dest.name}</span>
                <small>{dest.driveTime}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="reviews-section" id="reviews">
        <div className="section-heading" data-reveal>
          <p className="eyebrow">Client Feedback</p>
          <h2 className="reviews-title">Trusted by<br /><em>Valley Leaders.</em></h2>
        </div>
        <div className="reviews-grid">
          {clientReviews.map((r) => (
            <div className="review-card-item" key={r.author} data-reveal>
              <FiveStars />
              <p>“{r.quote}”</p>
              <div className="review-author">
                <strong>{r.author}</strong>
                <span>{r.title} · {r.trip}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta" id="contact">
        <p className="eyebrow" data-reveal>Your time is the luxury</p>
        <h2 data-reveal>Arrive with<br /><em>Permanence.</em></h2>
        <a className="button light" href="#book" data-reveal>Reserve Your Chauffeur <Arrow /></a>
      </section>

      <section className="social-marketing" id="social">
        <div data-reveal>
          <p className="eyebrow dark">Follow The Journey</p>
          <h2>Stay in<br /><em>the know.</em></h2>
        </div>
        <div className="social-copy" data-reveal>
          <p>Discover new service regions, Valley event charters, travel notes, and executive announcements.</p>
          <div className="social-links">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><span>Instagram</span><small>Connect with us</small><Arrow /></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpermanence-exclusive.com" target="_blank" rel="noreferrer"><span>Facebook</span><small>Share Permanence</small><Arrow /></a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fpermanence-exclusive.com" target="_blank" rel="noreferrer"><span>LinkedIn</span><small>Executive Network</small><Arrow /></a>
            <a href="https://x.com/intent/post?text=Excellence%20is%20Eternal." target="_blank" rel="noreferrer"><span>X</span><small>Latest News</small><Arrow /></a>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <a className="wordmark" href="#top"><strong>PERMANENCE</strong><span>EXCLUSIVE</span></a>
          <p>Excellence is Eternal.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <a href="#services">Services</a>
          <a href="#chauffeurs">Chauffeurs</a>
          <a href="#experience">Experience</a>
          <a href="#coverage">Destinations</a>
          <a href="#reviews">Reviews</a>
          <a href="#book">Book a Ride</a>
        </div>
        <div>
          <strong>Executive Reservations</strong>
          <a href="mailto:reservations@permanenceexclusive.com">reservations@permanenceexclusive.com</a>
          <span>Phoenix, Arizona · Sky Harbor (PHX) Dispatch</span>
          <a href="/admin">Chauffeur Portal</a>
        </div>
        <p className="copyright">© 2026 Permanence Exclusive · Private prearranged executive transportation</p>
      </footer>

      <a className="mobile-book" href="#book">
        <span className="mobile-book-full">Book Your Chauffeur</span>
        <span className="mobile-book-short">Book Now</span>
        <Arrow />
      </a>
    </main>
  );
}
