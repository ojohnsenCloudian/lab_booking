import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function AdminBookingsPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      bookingType: true,
      labResource: true,
    },
    orderBy: {
      startTime: "desc",
    },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <p className="text-muted-foreground">View and manage all bookings</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{booking.bookingType.name}</CardTitle>
                  <CardDescription>
                    {booking.labResource.name} • {booking.user.email}
                  </CardDescription>
                </div>
                <span className="text-sm capitalize">{booking.status.toLowerCase()}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">
                    {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")} -{" "}
                    {format(new Date(booking.endTime), "h:mm a")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Access Code: {booking.accessCode}
                  </p>
                </div>
                <Link href={`/dashboard/booking/${booking.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

