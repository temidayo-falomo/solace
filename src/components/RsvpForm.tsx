import type { FormEvent } from "react";
import "./rsvp.css";

export function RsvpForm({ section }: { section?: number }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hi EXA, I would like to RSVP for SOLACE on Wednesday, 4 November 2026 at 0808 Lagos.",
      `First Name: ${String(data.get("firstName")).trim()}`,
      `Last Name: ${String(data.get("lastName")).trim()}`,
      `Email Address: ${String(data.get("email")).trim()}`,
      `WhatsApp Number: ${String(data.get("whatsapp")).trim()}`,
      ...(section ? [`Preferred section: ${section}`] : []),
      "Please confirm my spot and availability. Thank you!",
    ].join("\n");
    window.location.assign(
      `https://wa.me/2348164511566?text=${encodeURIComponent(message)}`,
    );
  }
  return (
    <form className="rsvp-form" onSubmit={submit}>
      <h3>RSVP</h3>
      <div className="rsvp-fields">
        <label>
          First Name
          <input
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={80}
          />
        </label>
        <label>
          Last Name
          <input
            name="lastName"
            autoComplete="family-name"
            required
            maxLength={80}
          />
        </label>
        <label>
          Email Address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          WhatsApp Number
          <input
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            placeholder="e.g. +234 801 234 5678"
            required
            minLength={7}
            maxLength={25}
          />
        </label>
      </div>
      <button className="rsvp-submit" type="submit">
        RSVP ↗
      </button>
    </form>
  );
}
