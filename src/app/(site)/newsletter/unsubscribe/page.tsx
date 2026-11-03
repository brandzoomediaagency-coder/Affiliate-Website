import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo/metadata";
import { first } from "@/lib/search-params";
import { UnsubscribeForm } from "@/components/shared/unsubscribe-form";
import { Skeleton } from "@/components/ui/misc";

export async function generateMetadata() {
  return buildMetadata({ title: "Unsubscribe", path: "/newsletter/unsubscribe", noindex: true });
}

export default function UnsubscribePage({ searchParams }: PageProps<"/newsletter/unsubscribe">) {
  return (
    <div className="container-page max-w-lg py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Unsubscribe from the newsletter</h1>
      <Suspense fallback={<Skeleton className="mt-6 h-24 w-full" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/newsletter/unsubscribe">["searchParams"] }) {
  const token = first((await searchParams).token) ?? "";
  return <UnsubscribeForm token={token} />;
}
