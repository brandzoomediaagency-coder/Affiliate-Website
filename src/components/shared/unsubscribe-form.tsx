"use client";

import { useActionState } from "react";
import { unsubscribeFromNewsletter } from "@/lib/actions/public";
import { initialActionResult } from "@/lib/validation/form";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(unsubscribeFromNewsletter, initialActionResult);
  if (!token) return <Notice tone="error" className="mt-6">This unsubscribe link is missing its token.</Notice>;
  if (state.message) return <Notice tone={state.ok ? "success" : "error"} className="mt-6">{state.message}</Notice>;
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-ink-600">Click the button below to stop receiving newsletter emails.</p>
      <Button type="submit" disabled={pending}>
        {pending ? "Unsubscribing…" : "Unsubscribe"}
      </Button>
    </form>
  );
}
