import { buildMetadata } from "@/lib/seo/metadata";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const generateMetadata = () => buildMetadata({ title: "Choose a new password", path: "/reset-password", noindex: true });

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="Use the form below to set a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
