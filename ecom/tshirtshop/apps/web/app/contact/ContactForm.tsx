"use client";

import { useState } from "react";
import {
  isValidEmail,
  containsHtml,
  sanitizeString,
} from "@/lib/validation";

const MAX_SUBJECT = 200;
const MAX_MESSAGE = 2000;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  function validate(): boolean {
    const next: Record<string, string> = {};
    const n = sanitizeString(name);
    const e = email.trim();
    const s = sanitizeString(subject);
    const m = sanitizeString(message);

    if (!n || n.length < 2) {
      next.name = "Name must be at least 2 characters.";
    } else if (containsHtml(n)) {
      next.name = "Name cannot contain HTML.";
    }

    if (!e) {
      next.email = "Email is required.";
    } else if (!isValidEmail(e)) {
      next.email = "Please enter a valid email address.";
    }

    if (s && s.length > MAX_SUBJECT) {
      next.subject = `Subject must be ${MAX_SUBJECT} characters or less.`;
    } else if (s && containsHtml(s)) {
      next.subject = "Subject cannot contain HTML.";
    }

    if (!m || m.length < 10) {
      next.message = "Message must be at least 10 characters.";
    } else if (m.length > MAX_MESSAGE) {
      next.message = `Message must be ${MAX_MESSAGE} characters or less.`;
    } else if (containsHtml(m)) {
      next.message = "Message cannot contain HTML.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    setErrors({});

    try {
      // WARNING: No backend contact endpoint yet. Form shows success for demo.
      // To persist: add POST /api/v1/contact and wire here.
      await new Promise((r) => setTimeout(r, 600));
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrors({ form: "Something went wrong. Please try again." });
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg border border-white/10 bg-[#1A1A1A] p-8 text-center">
        <p className="text-lg font-medium text-white">
          Thank you for reaching out.
        </p>
        <p className="mt-2 text-sm text-white/70">
          We&apos;ll get back to you as soon as possible.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 min-h-[44px] rounded-md bg-[#FF4D00] px-6 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-6 rounded-lg border border-white/10 bg-[#1A1A1A] p-6 sm:p-8"
    >
      {errors.form && (
        <p className="text-sm text-red-400" role="alert">
          {errors.form}
        </p>
      )}

      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-white/80">
          Name *
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        {errors.name && (
          <p id="contact-name-error" className="mt-1 text-sm text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-white/80">
          Email *
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
        />
        {errors.email && (
          <p id="contact-email-error" className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-2 block text-sm font-medium text-white/80">
          Subject
        </label>
        <input
          id="contact-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Order inquiry, product question, etc."
          maxLength={MAX_SUBJECT}
          className="min-h-[44px] w-full rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
        />
        {errors.subject && (
          <p id="contact-subject-error" className="mt-1 text-sm text-red-400">
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-white/80">
          Message *
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          rows={5}
          maxLength={MAX_MESSAGE}
          className="w-full resize-y rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#FF4D00] focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        <p className="mt-1 text-xs text-white/50">
          {message.length} / {MAX_MESSAGE}
        </p>
        {errors.message && (
          <p id="contact-message-error" className="mt-1 text-sm text-red-400">
            {errors.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="min-h-[44px] w-full rounded-md bg-[#FF4D00] px-4 py-2 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#FF4D00]/90 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
