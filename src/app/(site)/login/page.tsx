import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/misc";

export const generateMetadata = () => buildMetadata({ title: "Log in", path: "/login", noindex: true });

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to sync your wishlist and recently viewed products.">
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const sp = await searchParams;
  return <LoginForm next={first(sp.next)} linkError={first(sp.error) === "link"} />;
}
