"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { gaEvent } from "@/lib/analytics/client";
import { useAuth } from "./auth-provider";
import { useToast } from "./toast-provider";

const GUEST_WISHLIST_KEY = "kw_guest_wishlist";
const GUEST_RECENT_KEY = "kw_recently_viewed";
const MAX_GUEST_RECENT = 24;

function readIds(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage may be unavailable (private mode); the in-memory state still works.
  }
}

type WishlistState = {
  ids: Set<string>;
  ready: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string, productName?: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  recordView: (productId: string) => void;
  guestRecentIds: () => string[];
};

const WishlistContext = createContext<WishlistState | null>(null);

/**
 * Wishlist & recently-viewed store.
 *  - Guests: saved in localStorage on this device.
 *  - Signed-in users: saved in the database (RLS restricts rows to the owner).
 *  - On sign-in, the guest wishlist and recent views are merged into the account.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const wishlistIdRef = useRef<string | null>(null);
  const trackRecentRef = useRef(true);

  const ensureWishlistId = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase || !user) return null;
    if (wishlistIdRef.current) return wishlistIdRef.current;
    const { data } = await supabase.from("wishlists").select("id").eq("user_id", user.id).maybeSingle();
    if (data?.id) {
      wishlistIdRef.current = data.id;
      return data.id;
    }
    const { data: created } = await supabase.from("wishlists").insert({ user_id: user.id }).select("id").single();
    wishlistIdRef.current = created?.id ?? null;
    return wishlistIdRef.current;
  }, [user]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    wishlistIdRef.current = null;

    (async () => {
      const supabase = getBrowserSupabase();
      if (!user || !supabase) {
        setIds(new Set(readIds(GUEST_WISHLIST_KEY)));
        setReady(true);
        return;
      }
      const wishlistId = await ensureWishlistId();
      const [{ data: profile }] = await Promise.all([
        supabase.from("profiles").select("privacy_prefs").eq("id", user.id).maybeSingle(),
      ]);
      const prefs = (profile?.privacy_prefs ?? {}) as { track_recently_viewed?: boolean };
      trackRecentRef.current = prefs.track_recently_viewed !== false;

      // Merge guest data collected before signing in.
      const guestWishlist = readIds(GUEST_WISHLIST_KEY);
      if (wishlistId && guestWishlist.length) {
        await supabase
          .from("wishlist_items")
          .upsert(
            guestWishlist.map((product_id) => ({ wishlist_id: wishlistId, product_id })),
            { onConflict: "wishlist_id,product_id", ignoreDuplicates: true },
          );
        writeIds(GUEST_WISHLIST_KEY, []);
      }
      const guestRecent = readIds(GUEST_RECENT_KEY);
      if (guestRecent.length && trackRecentRef.current) {
        const now = Date.now();
        await supabase.from("recently_viewed").upsert(
          guestRecent.map((product_id, i) => ({
            user_id: user.id,
            product_id,
            viewed_at: new Date(now - i * 1000).toISOString(),
          })),
          { onConflict: "user_id,product_id" },
        );
        writeIds(GUEST_RECENT_KEY, []);
      }

      const { data: items } = wishlistId
        ? await supabase.from("wishlist_items").select("product_id").eq("wishlist_id", wishlistId)
        : { data: [] as { product_id: string }[] };
      if (!cancelled) {
        setIds(new Set((items ?? []).map((i) => i.product_id)));
        setReady(true);
      }
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [user, loading, ensureWishlistId]);

  const remove = useCallback(
    async (productId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        if (!user) writeIds(GUEST_WISHLIST_KEY, [...next]);
        return next;
      });
      const supabase = getBrowserSupabase();
      if (user && supabase) {
        const wishlistId = await ensureWishlistId();
        if (wishlistId) {
          const { error } = await supabase
            .from("wishlist_items")
            .delete()
            .eq("wishlist_id", wishlistId)
            .eq("product_id", productId);
          if (error) {
            toast({ tone: "error", title: "Could not update your wishlist", description: "Please try again." });
            setIds((prev) => new Set(prev).add(productId));
            return;
          }
        }
      }
      toast({ tone: "info", title: "Removed from wishlist" });
    },
    [user, ensureWishlistId, toast],
  );

  const toggle = useCallback(
    async (productId: string, productName?: string) => {
      if (ids.has(productId)) {
        await remove(productId);
        return;
      }
      setIds((prev) => {
        const next = new Set(prev).add(productId);
        if (!user) writeIds(GUEST_WISHLIST_KEY, [...next]);
        return next;
      });
      const supabase = getBrowserSupabase();
      if (user && supabase) {
        const wishlistId = await ensureWishlistId();
        const { error } = wishlistId
          ? await supabase
              .from("wishlist_items")
              .upsert({ wishlist_id: wishlistId, product_id: productId }, { onConflict: "wishlist_id,product_id" })
          : { error: new Error("no wishlist") };
        if (error) {
          setIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
          toast({ tone: "error", title: "Could not save to wishlist", description: "Please try again." });
          return;
        }
      }
      gaEvent("add_to_wishlist", { item_id: productId, item_name: productName });
      toast({
        tone: "success",
        title: "Saved to wishlist",
        description: user ? productName : "Saved on this device. Sign in to keep it across devices.",
      });
    },
    [ids, user, ensureWishlistId, remove, toast],
  );

  const recordView = useCallback(
    (productId: string) => {
      const supabase = getBrowserSupabase();
      if (user && supabase) {
        if (!trackRecentRef.current) return;
        void supabase
          .from("recently_viewed")
          .upsert({ user_id: user.id, product_id: productId, viewed_at: new Date().toISOString() }, { onConflict: "user_id,product_id" });
        return;
      }
      const list = [productId, ...readIds(GUEST_RECENT_KEY).filter((id) => id !== productId)].slice(0, MAX_GUEST_RECENT);
      writeIds(GUEST_RECENT_KEY, list);
    },
    [user],
  );

  const value = useMemo<WishlistState>(
    () => ({
      ids,
      ready,
      has: (id) => ids.has(id),
      toggle,
      remove,
      recordView,
      guestRecentIds: () => readIds(GUEST_RECENT_KEY),
    }),
    [ids, ready, toggle, remove, recordView],
  );

  return <WishlistContext value={value}>{children}</WishlistContext>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
