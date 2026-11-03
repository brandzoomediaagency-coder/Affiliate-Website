"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgePercent,
  BarChart3,
  Boxes,
  FileText,
  FolderTree,
  History,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  Mail,
  Menu,
  Scale,
  Settings,
  Store,
  Tags,
  Users,
  X,
  ExternalLink,
} from "lucide-react";
import { BrandMark } from "@/components/shared/brand";
import { cn } from "@/lib/utils";

const groups: Array<{ title: string; items: Array<{ href: string; label: string; Icon: typeof LayoutDashboard; adminOnly?: boolean }> }> = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }, { href: "/admin/analytics", label: "Analytics", Icon: BarChart3 }] },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", Icon: Boxes },
      { href: "/admin/listings", label: "Affiliate listings", Icon: Link2 },
      { href: "/admin/categories", label: "Categories & brands", Icon: FolderTree },
      { href: "/admin/merchants", label: "Merchants & programmes", Icon: Store, adminOnly: true },
      { href: "/admin/deals", label: "Deals & offers", Icon: BadgePercent },
      { href: "/admin/comparisons", label: "Comparisons", Icon: Scale },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blog", label: "Blog posts", Icon: FileText },
      { href: "/admin/blog/taxonomy", label: "Authors, categories & tags", Icon: Tags },
      { href: "/admin/banners", label: "Banners & hero", Icon: ImageIcon },
    ],
  },
  {
    title: "Audience",
    items: [
      { href: "/admin/users", label: "Users & roles", Icon: Users, adminOnly: true },
      { href: "/admin/newsletter", label: "Newsletter", Icon: Mail, adminOnly: true },
      { href: "/admin/messages", label: "Contact messages", Icon: Inbox, adminOnly: true },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Site settings", Icon: Settings, adminOnly: true },
      { href: "/admin/audit", label: "Audit log", Icon: History, adminOnly: true },
    ],
  },
];

export function AdminSidebar({ isAdmin, brandName, email }: { isAdmin: boolean; brandName: string; email: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));
  const isMostSpecific = (href: string) => {
    const all = groups.flatMap((g) => g.items.map((i) => i.href)).filter((h) => active(h));
    return all.sort((a, b) => b.length - a.length)[0] === href;
  };

  const nav = (
    <nav aria-label="Admin" className="space-y-6">
      {groups.map((g) => {
        const items = g.items.filter((i) => isAdmin || !i.adminOnly);
        if (items.length === 0) return null;
        return (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[0.65rem] font-bold tracking-[0.14em] text-ink-400 uppercase">{g.title}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={isMostSpecific(href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition",
                      isMostSpecific(href) ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="rounded-lg p-1.5 text-ink-700">
          <Menu className="size-6" />
        </button>
        <span className="font-bold text-ink-900">{brandName} Admin</span>
        <Link href="/" className="text-sm font-semibold text-brand-700">
          View site
        </Link>
      </div>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-ink-950 p-4 transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <BrandMark className="size-8" />
            <span className="font-extrabold">{brandName}</span>
            <span className="rounded bg-white/10 px-1.5 text-[0.6rem] font-bold tracking-wider uppercase">{isAdmin ? "Admin" : "Editor"}</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="text-ink-300 lg:hidden" aria-label="Close admin menu">
            <X className="size-5" />
          </button>
        </div>
        {nav}
        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-ink-400">
          <p className="truncate">{email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="inline-flex items-center gap-1 hover:text-white">
              View site <ExternalLink className="size-3" />
            </Link>
            <Link href="/account" className="hover:text-white">
              My account
            </Link>
          </div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-ink-950/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  );
}
