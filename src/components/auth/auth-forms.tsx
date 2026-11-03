"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { publicEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { emailSchema, passwordSchema } from "@/lib/validation/schemas";
import { gaEvent } from "@/lib/analytics/client";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/misc";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("email not confirmed")) return "Please confirm your email address first — check your inbox for the link.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try logging in.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
  if (m.includes("banned") || m.includes("disabled")) return "This account has been disabled. Please contact support.";
  if (m.includes("weak") || m.includes("password")) return message;
  return "Something went wrong. Please try again.";
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 hover:text-ink-700"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function GoogleButton({ next }: { next: string }) {
  const [loading, setLoading] = useState(false);
  if (!publicEnv.googleAuthEnabled) return null;
  return (
    <>
      <Button
        variant="outline"
        block
        size="lg"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const supabase = getBrowserSupabase();
          await supabase?.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
        }}
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
          <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1a6.4 6.4 0 0 1-6-4.4H2.3v2.8A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8L6 14.3Z" />
          <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.3 7.3L6 10.1a6.4 6.4 0 0 1 6-4.7Z" />
        </svg>
        Continue with Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

export function LoginForm({ next: rawNext, linkError }: { next?: string; linkError?: boolean }) {
  const router = useRouter();
  const next = safeNextPath(rawNext);
  const [error, setError] = useState<string | null>(linkError ? "That link is invalid or has expired. Please try again." : null);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <GoogleButton next={next} />
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          const email = emailSchema.safeParse(fd.get("email"));
          const password = String(fd.get("password") ?? "");
          if (!email.success || !password) {
            setError("Enter your email and password.");
            return;
          }
          const supabase = getBrowserSupabase();
          if (!supabase) {
            setError("Sign-in is not configured yet.");
            return;
          }
          setLoading(true);
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.data, password });
          setLoading(false);
          if (signInError) {
            setError(friendlyAuthError(signInError.message));
            return;
          }
          router.replace(next);
          router.refresh();
        }}
      >
        <Field label="Email" htmlFor="login-email">
          <Input id="login-email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <PasswordInput id="login-password" name="password" autoComplete="current-password" required />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href={`/signup${rawNext ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}

export function SignupForm({ next: rawNext }: { next?: string }) {
  const router = useRouter();
  const next = safeNextPath(rawNext);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (sentTo) {
    return (
      <Notice tone="success" title="Check your inbox">
        We sent a confirmation link to <strong>{sentTo}</strong>. Click it to activate your account, then log in.
      </Notice>
    );
  }

  return (
    <div>
      <GoogleButton next={next} />
      <form
        className="space-y-4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setFormError(null);
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get("name") ?? "").trim().slice(0, 120);
          const email = emailSchema.safeParse(fd.get("email"));
          const password = passwordSchema.safeParse(fd.get("password"));
          const nextErrors: Record<string, string> = {};
          if (!email.success) nextErrors.email = email.error.issues[0]?.message ?? "Invalid email";
          if (!password.success) nextErrors.password = password.error.issues[0]?.message ?? "Invalid password";
          if (fd.get("confirm") !== fd.get("password")) nextErrors.confirm = "Passwords do not match";
          if (!fd.get("terms")) nextErrors.terms = "Please accept the Terms and Privacy Policy";
          setErrors(nextErrors);
          if (Object.keys(nextErrors).length || !email.success || !password.success) return;

          const supabase = getBrowserSupabase();
          if (!supabase) {
            setFormError("Sign-up is not configured yet.");
            return;
          }
          setLoading(true);
          const { data, error } = await supabase.auth.signUp({
            email: email.data,
            password: password.data,
            options: {
              data: { full_name: name || undefined },
              emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
            },
          });
          setLoading(false);
          if (error) {
            setFormError(friendlyAuthError(error.message));
            return;
          }
          gaEvent("sign_up", { method: "email" });
          if (data.session) {
            router.replace(next);
            router.refresh();
          } else {
            setSentTo(email.data);
          }
        }}
      >
        <Field label="Full name (optional)" htmlFor="su-name">
          <Input id="su-name" name="name" autoComplete="name" maxLength={120} />
        </Field>
        <Field label="Email" htmlFor="su-email" errors={errors.email ? [errors.email] : undefined} required>
          <Input id="su-email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field
          label="Password"
          htmlFor="su-password"
          hint="At least 8 characters, including a letter and a number."
          errors={errors.password ? [errors.password] : undefined}
          required
        >
          <PasswordInput id="su-password" name="password" autoComplete="new-password" required aria-invalid={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm password" htmlFor="su-confirm" errors={errors.confirm ? [errors.confirm] : undefined} required>
          <PasswordInput id="su-confirm" name="confirm" autoComplete="new-password" required aria-invalid={Boolean(errors.confirm)} />
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-ink-600">
          <Checkbox name="terms" className="mt-0.5" required />
          <span>
            I agree to the{" "}
            <Link href="/terms-and-conditions" className="font-semibold text-brand-700 underline" target="_blank">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-semibold text-brand-700 underline" target="_blank">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
        {formError && <Notice tone="error">{formError}</Notice>}
        <Button type="submit" block size="lg" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (sent) {
    return (
      <Notice tone="success" title="Check your email">
        If an account exists for that address, we&apos;ve sent a link to reset your password. The link expires soon, so use it
        promptly.
      </Notice>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const email = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
        if (!email.success) {
          setError("Enter a valid email address.");
          return;
        }
        const supabase = getBrowserSupabase();
        if (!supabase) return setError("Password reset is not configured yet.");
        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        setLoading(false);
        // Do not reveal whether the email exists; only surface rate limits.
        if (resetError && /rate|too many/i.test(resetError.message)) {
          setError(friendlyAuthError(resetError.message));
          return;
        }
        setSent(true);
      }}
    >
      <Field label="Email" htmlFor="fp-email">
        <Input id="fp-email" name="email" type="email" autoComplete="email" required />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" block size="lg" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  if (done) {
    return (
      <Notice tone="success" title="Password updated">
        Your password has been changed. Redirecting to your account…
      </Notice>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const password = passwordSchema.safeParse(fd.get("password"));
        if (!password.success) return setError(password.error.issues[0]?.message ?? "Invalid password");
        if (fd.get("confirm") !== fd.get("password")) return setError("Passwords do not match.");
        const supabase = getBrowserSupabase();
        if (!supabase) return setError("Not configured.");
        const { data } = await supabase.auth.getUser();
        if (!data.user) return setError("Your reset link has expired. Please request a new one.");
        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password: password.data });
        setLoading(false);
        if (updateError) return setError(friendlyAuthError(updateError.message));
        setDone(true);
        setTimeout(() => {
          router.replace("/account");
          router.refresh();
        }, 1200);
      }}
    >
      <Field label="New password" htmlFor="rp-password" hint="At least 8 characters, including a letter and a number.">
        <PasswordInput id="rp-password" name="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm new password" htmlFor="rp-confirm">
        <PasswordInput id="rp-confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" block size="lg" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
