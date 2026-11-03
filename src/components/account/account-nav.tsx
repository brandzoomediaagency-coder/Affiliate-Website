"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isStaff, signOut } = useAuth();
  const items = [
    { href: "/account", label: "Overview", Icon: LayoutDashboard },
    { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
    { href: "/account/profile", label: "Profile & settings", Icon: Settings },
    ...(isStaff ? [{ href: "/admin", label: "Admin dashboard", Icon: ShieldCheck }] : []),
  ];
  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition",
              active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-white hover:text-ink-900",
            )}
          >
            <Icon className="size-4" aria-hidden="true" /> {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/");
          router.refresh();
        }}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-600 hover:bg-white hover:text-ink-900"
      >
        <LogOut className="size-4" aria-hidden="true" /> Log out
      </button>
    </nav>
  );
}
