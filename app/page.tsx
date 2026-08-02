"use client";

import { useState } from "react";
import BookingFlow, { Arrow } from "./components/BookingFlow";

const services = [
  ["01", "Airport transfers", "Quiet, punctual arrivals and departures at PHX and Mesa Gateway."],
  ["02", "Corporate travel", "A composed, discreet experience for executives, clients, and teams."],
  ["03", "Hourly chauffeur", "A dedicated vehicle and chauffeur, available around your schedule."],
  ["04", "Events & evenings", "Concerts, celebrations, dining, and special occasions—handled elegantly."],
  ["05", "Point to point", "Private door-to-door travel across the Valley, reserved in advance."],
  ["06", "Arizona journeys", "Long-distance and custom itineraries available by personal quote."],
];

const cities = [
  "Phoenix", "Scottsdale", "Paradise Valley", "Tempe", "Chandler",
  "Gilbert", "Mesa", "Glendale", "Peoria", "Goodyear",
];

export default function Home() {
  const [bookServiceName, setBookServiceName] = useState<string | null>(null);

  function bookService(service: string) {
    setBookServiceName(service);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      <header className="nav">
        <a className="wordmark" href="#top" aria-label="Permanence Exclusive home">
          <strong>PERMANENCE</strong>
          <span>EXCLUSIVE</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#services">Services</a>
          <a href="#experience">Experience</a>
          <a href="#coverage">Coverage</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-book" href="#book">Book your ride <Arrow /></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-image" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">Private chauffeur service · Arizona Valley</p>
          <h1>Your journey.<br /><em>Elevated.</em></h1>
          <p className="hero-copy">Private luxury transportation across the Arizona Valley, designed around your schedule.</p>
          <div className="hero-actions">
            <a className="button light" href="#book">Book your ride <Arrow /></a>
            <a className="text-link" href="#experience">Discover the experience <Arrow down /></a>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true"><span>01</span><i /></div>
      </section>

      <section className="booking-section" id="book">
        <div className="section-heading">
          <p className="eyebrow dark">Reserve your journey</p>
          <h2>A better way<br />to move.</h2>
          <p>Tell us where you’re going. We’ll shape the details around you.</p>
        </div>
        <BookingFlow
          initialService={bookServiceName}
          onServiceConsumed={() => setBookServiceName(null)}
        />
      </section>

      <section className="trust-strip" aria-label="Service qualities">
        {["Professional service", "Prearranged transportation", "Secure payments", "Arizona Valley coverage"].map((item) => <span key={item}>{item}</span>)}
      </section>

      <section className="manifesto" id="experience">
        <p className="eyebrow">The Permanence standard</p>
        <p className="manifesto-copy">This is not simply a ride.<br />It is the space between <em>where you are</em><br />and <em>what comes next.</em></p>
        <div className="manifesto-aside">
          <p>Calm, considered, and entirely yours. Every detail is arranged in advance so you can settle in and move through the Valley with confidence.</p>
          <a href="#services">Explore our services <Arrow /></a>
        </div>
      </section>

      <section className="services" id="services">
        <div className="section-heading services-heading">
          <p className="eyebrow dark">Ways to travel</p>
          <h2>Service,<br /><em>considered.</em></h2>
        </div>
        <div className="service-list">
          {services.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <button onClick={() => bookService(title)} aria-label={`Book ${title}`}>Book <Arrow /></button>
            </article>
          ))}
        </div>
      </section>

      <section className="fleet-panel">
        <div className="fleet-copy">
          <p className="eyebrow">The vehicle</p>
          <h2>Quiet luxury.<br />Impeccably kept.</h2>
          <p>Our launch fleet is centered on a private luxury sedan selected for comfort, presence, and a composed ride. Additional executive vehicles will join as the service grows.</p>
          <div className="fleet-specs">
            <span><strong>Up to 3</strong> passengers</span>
            <span><strong>Climate</strong> controlled</span>
            <span><strong>Complimentary</strong> water</span>
          </div>
        </div>
        <div className="fleet-visual" role="img" aria-label="Black luxury executive sedan at a modern Arizona residence" />
      </section>

      <section className="coverage" id="coverage">
        <div>
          <p className="eyebrow dark">Arizona Valley coverage</p>
          <h2>From here,<br />to anywhere.</h2>
        </div>
        <div className="coverage-copy">
          <p>Prearranged private travel throughout Phoenix and the surrounding Valley. Statewide journeys and destinations beyond our standard area are welcomed by personal quote.</p>
          <div className="city-grid">
            {cities.map((city) => <span key={city}>{city}</span>)}
          </div>
        </div>
      </section>

      <section className="final-cta" id="contact">
        <p className="eyebrow">Your time is the luxury</p>
        <h2>Arrive with<br /><em>Permanence.</em></h2>
        <a className="button light" href="#book">Reserve your ride <Arrow /></a>
      </section>

      <section className="social-marketing" id="social">
        <div>
          <p className="eyebrow dark">Follow the journey</p>
          <h2>Stay in<br /><em>the know.</em></h2>
        </div>
        <div className="social-copy">
          <p>New service areas, Valley events, travel notes, and the details that make every journey exceptional.</p>
          <div className="social-links">
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer"><span>Instagram</span><small>Connect your profile</small><Arrow /></a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fpermanence-exclusive.marshmatimba9.chatgpt.site" target="_blank" rel="noreferrer"><span>Facebook</span><small>Share Permanence</small><Arrow /></a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fpermanence-exclusive.marshmatimba9.chatgpt.site" target="_blank" rel="noreferrer"><span>LinkedIn</span><small>Share with your network</small><Arrow /></a>
            <a href="https://x.com/intent/post?text=Excellence%20is%20Eternal.&url=https%3A%2F%2Fpermanence-exclusive.marshmatimba9.chatgpt.site" target="_blank" rel="noreferrer"><span>X</span><small>Share the launch</small><Arrow /></a>
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
          <a href="#experience">Experience</a>
          <a href="#coverage">Coverage</a>
          <a href="#social">Social</a>
          <a href="#book">Book a ride</a>
        </div>
        <div>
          <strong>Reservations</strong>
          <a href="mailto:reservations@permanenceexclusive.com">reservations@permanenceexclusive.com</a>
          <span>Phoenix, Arizona</span>
          <a href="/admin">Owner administration</a>
        </div>
        <p className="copyright">© 2026 Permanence Exclusive · Private prearranged transportation</p>
      </footer>
      <a className="mobile-book" href="#book">Book your ride <Arrow /></a>
    </main>
  );
}
