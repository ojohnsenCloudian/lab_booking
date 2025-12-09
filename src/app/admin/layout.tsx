import { requireAdmin } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-xl">
              Lab Booking Admin
            </Link>
            <div className="flex gap-4">
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/resources">Resources</Link>
              <Link href="/admin/lab-types">Lab Types</Link>
              <Link href="/admin/users">Users</Link>
              <Link href="/admin/bookings">Bookings</Link>
              <Link href="/admin/audit-logs">Audit Logs</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
