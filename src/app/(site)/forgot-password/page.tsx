import { buildMetadata } from "@/lib/seo/metadata";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const generateMetadata = () => buildMetadata({ title: "Reset your password", path: "/forgot-password", noindex: true });

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
