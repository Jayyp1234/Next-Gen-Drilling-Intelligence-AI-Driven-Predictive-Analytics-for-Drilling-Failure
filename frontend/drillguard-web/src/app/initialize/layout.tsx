import { Sidebar } from "@/components/layout/Sidebar";
import { RequireAuth } from "@/components/layout/RequireAuth";

export default function InitializeLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
    <div data-sidebar="light" className="flex min-h-screen bg-bg">
      <Sidebar wizard />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
    </RequireAuth>
  );
}
