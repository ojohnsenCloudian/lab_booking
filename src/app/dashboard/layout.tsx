import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if admin exists, redirect to setup if not
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  })

  if (adminCount === 0) {
    redirect("/initial-setup")
  }

  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold">
              Lab Booking
            </Link>
            <Link href="/dashboard" className="text-sm hover:underline">
              Dashboard
            </Link>
            <Link href="/dashboard/availability" className="text-sm hover:underline">
              Availability
            </Link>
            <Link href="/dashboard/booking/new" className="text-sm hover:underline">
              New Booking
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
            <form
              action={async () => {
                "use server"
                await signOut({ redirectTo: "/login" })
              }}
            >
              <Button type="submit" variant="outline" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

