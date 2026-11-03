import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/misc";

export const generateMetadata = () => buildMetadata({ title: "Create an account", path: "/signup", noindex: true });

export default function SignupPage({ searchParams }: PageProps<"/signup">) {
  return (
    <AuthShell title="Create your free account" subtitle="Save products to your wishlist and access them on any device.">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/signup">["searchParams"] }) {
  return <SignupForm next={first((await searchParams).next)} />;
}
