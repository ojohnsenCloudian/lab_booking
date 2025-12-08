import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  // Get statistics
  const [totalBookings, activeBookings, totalUsers, totalResources, totalBookingTypes] =
    await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          status: {
            in: ["UPCOMING", "ACTIVE"],
          },
        },
      }),
      prisma.user.count(),
      prisma.labResource.count(),
      prisma.bookingType.count(),
    ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage lab resources and bookings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
            <CardDescription>All time bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
            <CardDescription>Upcoming and active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeBookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Lab resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalResources}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/resources">
              <Button variant="outline" className="w-full justify-start">
                Manage Resources
              </Button>
            </Link>
            <Link href="/admin/booking-types">
              <Button variant="outline" className="w-full justify-start">
                Manage Booking Types
              </Button>
            </Link>
            <Link href="/admin/templates">
              <Button variant="outline" className="w-full justify-start">
                Manage Connection Templates
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/bookings">
              <Button variant="outline" className="w-full justify-start">
                View All Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking Types:</span>
              <span className="font-medium">{totalBookingTypes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resources:</span>
              <span className="font-medium">{totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Bookings:</span>
              <span className="font-medium">{activeBookings}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

