"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string;
  reference: string;
  status: string;
  service: string;
  vehicle: string;
  pickup: string;
  destination: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  estimatedFareCents: number;
};

const demoBookings: Booking[] = [
  { id: "demo-1", reference: "PE-DEMO1", status: "Confirmed", service: "Airport transfer", vehicle: "Luxury sedan", pickup: "Phoenix Sky Harbor", destination: "Paradise Valley", pickupDate: "2026-08-02", pickupTime: "14:30", passengers: 2, customerName: "Demonstration Client", customerEmail: "demo@example.com", customerPhone: "(000) 000-0000", estimatedFareCents: 14800 },
  { id: "demo-2", reference: "PE-DEMO2", status: "Quote Requested", service: "Hourly chauffeur", vehicle: "Luxury sedan", pickup: "Scottsdale", destination: "Custom itinerary", pickupDate: "2026-08-05", pickupTime: "18:00", passengers: 3, customerName: "Sample Executive", customerEmail: "sample@example.com", customerPhone: "(000) 000-0000", estimatedFareCents: 24000 },
];

export default function AdminDashboard({ ownerName }: { ownerName: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch("/api/bookings")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setBookings(data.bookings))
      .catch(() => { setBookings(demoBookings); setIsDemo(true); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filter === "All" ? bookings : bookings.filter((booking) => booking.status === filter), [bookings, filter]);
  const todayRevenue = bookings.filter((booking) => booking.status !== "Cancelled").reduce((sum, booking) => sum + booking.estimatedFareCents, 0);

  async function updateStatus(booking: Booking, status: string) {
    if (booking.id.startsWith("demo-")) {
      const updated = { ...booking, status };
      setBookings((items) => items.map((item) => item.id === booking.id ? updated : item));
      setSelected(updated);
      return;
    }
    const response = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: booking.id, status }),
    });
    if (response.ok) {
      const { booking: updated } = await response.json();
      setBookings((items) => items.map((item) => item.id === booking.id ? updated : item));
      setSelected(updated);
    }
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-wordmark" href="/"><strong>PERMANENCE</strong><span>EXCLUSIVE</span></a>
        <nav>
          <a className="active" href="#dashboard">Overview</a>
          <a href="#bookings">Bookings <b>{bookings.length}</b></a>
          <a href="#calendar">Calendar</a>
          <a href="#customers">Customers</a>
          <a href="#fleet">Fleet</a>
          <a href="#pricing">Pricing</a>
          <a href="#marketing">Marketing</a>
        </nav>
        <div className="admin-sidebar-foot">
          <button
            className="back-site"
            type="button"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
          >
            Sign out
          </button>
          <a className="back-site" href="/">← Customer site</a>
        </div>
      </aside>
      <section className="admin-main">
        <header>
          <div><p>Owner dashboard</p><h1>Good evening, {ownerName.split(" ")[0]}.</h1></div>
          <a href="/#book">+ New booking</a>
        </header>
        {isDemo && <div className="demo-banner">Demonstration mode · These sample bookings are not real customer records.</div>}
        <div className="admin-metrics" id="dashboard">
          <article><span>Upcoming rides</span><strong>{bookings.filter((b) => !["Completed", "Cancelled"].includes(b.status)).length}</strong><small>Current schedule</small></article>
          <article><span>Needs attention</span><strong>{bookings.filter((b) => b.status === "Quote Requested").length}</strong><small>Quote requests</small></article>
          <article><span>Projected value</span><strong>${(todayRevenue / 100).toLocaleString()}</strong><small>Excludes cancellations</small></article>
          <article><span>Fleet status</span><strong>1</strong><small>Vehicle available</small></article>
        </div>
        <section className="booking-admin" id="bookings">
          <div className="admin-section-head">
            <div><p>Operations</p><h2>Bookings</h2></div>
            <div className="admin-filters">
              {["All", "Quote Requested", "Confirmed", "Completed"].map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{value}</button>)}
            </div>
          </div>
          <div className="booking-table">
            <div className="table-head"><span>Reference</span><span>Passenger</span><span>Journey</span><span>Pickup</span><span>Status</span><span>Fare</span></div>
            {loading ? <p className="empty-state">Loading bookings…</p> : filtered.length === 0 ? <p className="empty-state">No bookings in this view.</p> : filtered.map((booking) => (
              <button className="table-row" key={booking.id} onClick={() => setSelected(booking)}>
                <span><b>{booking.reference}</b><small>{booking.service}</small></span>
                <span>{booking.customerName}<small>{booking.passengers} passenger{booking.passengers === 1 ? "" : "s"}</small></span>
                <span>{booking.pickup}<small>to {booking.destination}</small></span>
                <span>{booking.pickupDate}<small>{booking.pickupTime}</small></span>
                <span><i className={`status-dot ${booking.status.toLowerCase().replaceAll(" ", "-")}`} />{booking.status}</span>
                <span>${(booking.estimatedFareCents / 100).toFixed(2)}</span>
              </button>
            ))}
          </div>
        </section>
      </section>
      {selected && (
        <div className="booking-drawer" role="dialog" aria-modal="true" aria-label={`Booking ${selected.reference}`}>
          <button className="drawer-close" onClick={() => setSelected(null)} aria-label="Close booking details">×</button>
          <p>Booking detail</p><h2>{selected.reference}</h2>
          <div className="drawer-status"><span>Status</span><strong>{selected.status}</strong></div>
          <dl>
            <dt>Passenger</dt><dd>{selected.customerName}<br />{selected.customerEmail}<br />{selected.customerPhone}</dd>
            <dt>Pickup</dt><dd>{selected.pickup}<br />{selected.pickupDate} at {selected.pickupTime}</dd>
            <dt>Destination</dt><dd>{selected.destination}</dd>
            <dt>Service</dt><dd>{selected.service} · {selected.vehicle}</dd>
            <dt>Estimated fare</dt><dd>${(selected.estimatedFareCents / 100).toFixed(2)}</dd>
          </dl>
          <label>Update status<select value={selected.status} onChange={(event) => updateStatus(selected, event.target.value)}>
            {["Quote Requested", "Confirmed", "Assigned", "Driver En Route", "Completed", "Cancelled"].map((status) => <option key={status}>{status}</option>)}
          </select></label>
          <a href={`mailto:${selected.customerEmail}?subject=Your Permanence Exclusive booking ${selected.reference}`}>Email passenger ↗</a>
        </div>
      )}
    </main>
  );
}
