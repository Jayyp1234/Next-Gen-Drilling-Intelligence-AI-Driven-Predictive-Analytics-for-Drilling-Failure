import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RequireAuth } from "@/components/layout/RequireAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-bg">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          {/* pb leaves room for the mobile bottom tab bar; cleared on lg+ */}
          <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
