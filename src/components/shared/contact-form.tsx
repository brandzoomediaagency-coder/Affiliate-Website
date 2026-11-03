"use client";

import { useActionState } from "react";
import { submitContactMessage } from "@/lib/actions/public";
import { initialActionResult } from "@/lib/validation/form";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/misc";

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactMessage, initialActionResult);
  if (state.ok) {
    return (
      <Notice tone="success" title="Message sent">
        {state.message}
      </Notice>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="c-name" errors={state.fieldErrors?.name} required>
          <Input id="c-name" name="name" autoComplete="name" required maxLength={120} />
        </Field>
        <Field label="Email" htmlFor="c-email" errors={state.fieldErrors?.email} required>
          <Input id="c-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </Field>
      </div>
      <Field label="Subject" htmlFor="c-subject" errors={state.fieldErrors?.subject} required>
        <Input id="c-subject" name="subject" required maxLength={200} />
      </Field>
      <Field label="Message" htmlFor="c-message" errors={state.fieldErrors?.message} required>
        <Textarea id="c-message" name="message" rows={6} required maxLength={5000} />
      </Field>
      {/* Honeypot field for bots */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.message && !state.ok && <Notice tone="error">{state.message}</Notice>}
      <p className="text-xs text-ink-500">We use your details only to reply to your message. See our Privacy Policy.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
