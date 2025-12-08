import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { addDays } from "date-fns"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const now = new Date()

  // Get upcoming bookings
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      startTime: {
        gte: now,
      },
      status: {
        in: ["UPCOMING", "ACTIVE"],
      },
    },
    include: {
      bookingType: true,
      labResource: true,
    },
    orderBy: {
      startTime: "asc",
    },
    take: 5,
  })

  // Get past bookings
  const pastBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      endTime: {
        lt: now,
      },
      status: {
        in: ["COMPLETED", "CANCELLED"],
      },
    },
    include: {
      bookingType: true,
      labResource: true,
    },
    orderBy: {
      startTime: "desc",
    },
    take: 5,
  })

  // Check cooldown status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lastBookingDate: true },
  })

  let cooldownStatus = null
  if (user?.lastBookingDate) {
    const cooldownEnd = addDays(user.lastBookingDate, 3)
    if (cooldownEnd > now) {
      const daysRemaining = Math.ceil(
        (cooldownEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      cooldownStatus = {
        canBook: false,
        daysRemaining,
      }
    } else {
      cooldownStatus = {
        canBook: true,
      }
    }
  } else {
    cooldownStatus = {
      canBook: true,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your lab bookings</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/availability">
            <Button variant="outline">View Availability</Button>
          </Link>
          <Link href="/dashboard/booking/new">
            <Button>New Booking</Button>
          </Link>
        </div>
      </div>

      {cooldownStatus && !cooldownStatus.canBook && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle>Cooldown Period Active</CardTitle>
            <CardDescription>
              You must wait {cooldownStatus.daysRemaining} more day(s) before booking again.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your scheduled lab sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-muted-foreground">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{booking.bookingType.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.labResource.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")} -{" "}
                        {format(new Date(booking.endTime), "h:mm a")}
                      </p>
                    </div>
                    <Link href={`/dashboard/booking/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your past lab sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {pastBookings.length === 0 ? (
              <p className="text-muted-foreground">No past bookings</p>
            ) : (
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{booking.bookingType.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.labResource.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.startTime), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Link href={`/dashboard/booking/${booking.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

