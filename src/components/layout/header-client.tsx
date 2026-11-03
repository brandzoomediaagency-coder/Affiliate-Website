"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  User,
  X,
  House,
} from "lucide-react";
import { mainNav } from "@/config/site";
import { useAuth } from "@/components/providers/auth-provider";
import { useWishlist } from "@/components/providers/wishlist-provider";
import { CategoryIcon } from "@/components/shared/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";

export type NavCategory = { slug: string; name: string; icon: string | null; children: Array<{ slug: string; name: string }> };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) =>
          item.href === "/categories" ? (
            <li key={item.href} ref={ref} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="categories-menu"
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive(pathname, item.href) ? "text-brand-700" : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
                )}
              >
                {item.label} <ChevronDown className={cn("size-4 transition", open && "rotate-180")} aria-hidden="true" />
              </button>
              {open && (
                <div
                  id="categories-menu"
                  className="absolute top-full left-0 z-50 mt-2 w-[min(52rem,90vw)] animate-fade-up rounded-2xl border border-line bg-white p-5 shadow-pop"
                >
                  <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                    {categories.map((c) => (
                      <div key={c.slug}>
                        <Link href={`/categories/${c.slug}`} className="flex items-center gap-2 font-semibold text-ink-900 hover:text-brand-700">
                          <CategoryIcon name={c.icon} className="size-4 text-brand-500" />
                          {c.name}
                        </Link>
                        {c.children.length > 0 && (
                          <ul className="mt-1.5 space-y-1 pl-6">
                            {c.children.slice(0, 4).map((child) => (
                              <li key={child.slug}>
                                <Link href={`/categories/${child.slug}`} className="text-sm text-ink-500 hover:text-brand-700">
                                  {child.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link href="/categories" className="mt-5 inline-block text-sm font-semibold text-brand-700">
                    Browse all categories →
                  </Link>
                </div>
              )}
            </li>
          ) : (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  isActive(pathname, item.href) ? "text-brand-700" : "text-ink-700 hover:bg-ink-900/5 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

export function WishlistLink() {
  const { ids } = useWishlist();
  const count = ids.size;
  return (
    <Link
      href="/wishlist"
      className="relative grid size-10 place-items-center rounded-xl text-ink-700 transition hover:bg-ink-900/5"
      aria-label={count ? `Wishlist (${count} saved)` : "Wishlist"}
    >
      <Heart className="size-5" aria-hidden="true" />
      {count > 0 && (
        <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[0.6rem] leading-4 font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function UserMenu() {
  const { user, isStaff, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (loading) return <div className="hidden h-10 w-36 rounded-xl bg-canvas sm:block" aria-hidden="true" />;

  if (!user) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Log in
        </Link>
        <Link href="/signup" className={buttonVariants({ variant: "primary", size: "sm" })}>
          Sign Up
        </Link>
      </div>
    );
  }

  const name = (user.user_metadata?.full_name as string | undefined) || user.email || "Account";
  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 transition hover:bg-ink-900/5"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">{getInitials(name)}</span>
        <ChevronDown className="size-4 text-ink-500" aria-hidden="true" />
        <span className="sr-only">Open account menu</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-60 animate-fade-up rounded-2xl border border-line bg-white p-2 shadow-pop">
          <p className="truncate px-3 py-2 text-xs text-ink-500">{user.email}</p>
          {[
            { href: "/account", label: "My account", Icon: LayoutDashboard },
            { href: "/account/wishlist", label: "Wishlist", Icon: Heart },
            { href: "/account/profile", label: "Profile & settings", Icon: Settings },
            ...(isStaff ? [{ href: "/admin", label: "Admin dashboard", Icon: ShieldCheck }] : []),
          ].map(({ href, label, Icon }) => (
            <Link key={href} href={href} role="menuitem" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-canvas">
              <Icon className="size-4 text-ink-400" aria-hidden="true" /> {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await signOut();
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-canvas"
          >
            <LogOut className="size-4 text-ink-400" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileMenu({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isStaff, signOut } = useAuth();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-xl text-ink-700 hover:bg-ink-900/5 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-[85] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-[min(21rem,88vw)] animate-fade-up flex-col overflow-y-auto bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="font-bold text-ink-900">Menu</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-500 hover:bg-canvas" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="p-3">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl px-3 py-2.5 font-semibold",
                    isActive(pathname, item.href) ? "bg-brand-50 text-brand-700" : "text-ink-800 hover:bg-canvas",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-line p-3">
              <p className="px-3 pb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">Shop by category</p>
              <ul className="grid grid-cols-1 gap-0.5">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categories/${c.slug}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-canvas">
                      <CategoryIcon name={c.icon} className="size-4 text-brand-500" /> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto border-t border-line p-4">
              {user ? (
                <div className="space-y-2">
                  <Link href="/account" className={buttonVariants({ variant: "outline", block: true })}>
                    My account
                  </Link>
                  {isStaff && (
                    <Link href="/admin" className={buttonVariants({ variant: "soft", block: true })}>
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    className={buttonVariants({ variant: "ghost", block: true })}
                    onClick={async () => {
                      await signOut();
                      router.push("/");
                      router.refresh();
                    }}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                    Log in
                  </Link>
                  <Link href="/signup" className={buttonVariants({ variant: "primary" })}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { ids } = useWishlist();
  const { user } = useAuth();
  if (pathname.startsWith("/admin")) return null;
  const items = [
    { href: "/", label: "Home", Icon: House },
    { href: "/categories", label: "Categories", Icon: LayoutGrid },
    { href: "/deals", label: "Deals", Icon: Tag },
    { href: "/search", label: "Search", Icon: Search },
    { href: "/wishlist", label: "Wishlist", Icon: Heart, badge: ids.size },
    { href: user ? "/account" : "/login", label: user ? "Account" : "Log in", Icon: User },
  ];
  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid grid-cols-6">
        {items.map(({ href, label, Icon, badge }) => {
          const active = isActive(pathname, href);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 text-[0.65rem] font-semibold",
                  active ? "text-brand-700" : "text-ink-500",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
                {badge ? (
                  <span className="absolute top-1 right-[calc(50%-1.1rem)] min-w-4 rounded-full bg-rose-500 px-1 text-center text-[0.55rem] leading-4 text-white">
                    {badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

