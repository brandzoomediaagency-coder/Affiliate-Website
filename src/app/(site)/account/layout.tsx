import { AccountNav } from "@/components/account/account-nav";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-8">
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
