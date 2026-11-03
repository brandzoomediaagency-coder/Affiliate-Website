import { Suspense } from "react";
import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { getSiteSettings } from "@/lib/data/settings";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Skeleton } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Admin is always request-time and role-gated; skip instant-navigation validation. */
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  // Server-side role check (proxy.ts only checks that a session exists).
  const user = await requireStaff("/admin");
  const settings = await getSiteSettings();
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <AdminSidebar isAdmin={user.isAdmin} brandName={settings.brandName} email={user.email} />
      <div className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-dvh bg-canvas lg:flex">
      <div className="hidden w-64 bg-ink-950 lg:block" />
      <div className="flex-1 space-y-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
