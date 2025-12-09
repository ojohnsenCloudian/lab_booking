import { requireAuth } from "@/lib/auth-helpers";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-xl">
              Lab Booking
            </Link>
            <div className="flex gap-4">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/availability">Availability</Link>
              <Link href="/dashboard/history">History</Link>
              <Link href="/dashboard/profile">Profile</Link>
              {session.user.role === "ADMIN" && (
                <Link href="/admin">Admin</Link>
              )}
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
