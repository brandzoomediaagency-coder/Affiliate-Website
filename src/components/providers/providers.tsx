"use client";

import { AuthProvider } from "./auth-provider";
import { ToastProvider } from "./toast-provider";
import { WishlistProvider } from "./wishlist-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
