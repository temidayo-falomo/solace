import { useState, type FormEvent } from "react";
import { saveRsvp } from "../lib/rsvp";
import "./rsvp.css";

type Status = "idle" | "sending" | "sent" | "error";

export function RsvpForm({ section }: { section?: number }) {
  const isReservation = section !== undefined;
  const title = isReservation ? "CONFIRM YOUR RESERVATION" : "RSVP to join the guestlist";
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName")).trim();
    const lastName = String(data.get("lastName")).trim();
    const email = String(data.get("email")).trim();

    if (isReservation) {
      const message = [
        "Hi EXA, I would like to confirm my table reservation for SOLACE on Wednesday, 4 November 2026 at 0808 Lagos.",
        `First Name: ${firstName}`,
        `Last Name: ${lastName}`,
        `Email Address: ${email}`,
        `Preferred section: ${section}`,
        "Please confirm my reservation and availability. Thank you!",
      ].join("\n");
      window.location.assign(
        `https://wa.me/2348164511566?text=${encodeURIComponent(message)}`,
      );
      return;
    }

    setStatus("sending");
    try {
      await saveRsvp({ name: String(data.get("name") || "").trim(), email, phone: String(data.get("phone") || "").trim() });
      setStatus("sent");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t confirm your signup. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rsvp-form" role="status">
        <p>You’re on the guestlist.</p>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={submit} aria-busy={status === "sending"}>
      <h3>{title}</h3>
      <div className="rsvp-fields">
        {isReservation ? <>
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
        </> : <>
          <label className="rsvp-field-wide">
            Full name
            <input name="name" autoComplete="name" required maxLength={160} pattern=".*\S.*" />
          </label>
          <label className="rsvp-field-wide">
            Phone (optional)
            <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
          </label>
        </>}
        <label className="rsvp-field-wide">
          Email Address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
      </div>
      <button
        className="rsvp-submit"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? "SENDING…" : `${title} ↗`}
      </button>
      {status === "error" && (
        <p className="rsvp-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
