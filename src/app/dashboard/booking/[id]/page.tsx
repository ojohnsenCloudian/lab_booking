import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import Link from "next/link"
import { ConnectionInfoDisplay } from "@/components/connection-info"
import { CopyAccessCodeButton } from "@/components/copy-access-code-button"
import { CancelBookingButton } from "@/components/cancel-booking-button"

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      bookingType: true,
      labResource: true,
      connectionInfo: {
        include: {
          template: true,
        },
      },
    },
  })

  if (!booking) {
    redirect("/dashboard")
  }

  if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
    redirect("/dashboard")
  }

  const canCancel = booking.status === "UPCOMING" || booking.status === "ACTIVE"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Details</h1>
          <p className="text-muted-foreground">View and manage your booking</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Booking Type</p>
              <p className="text-lg">{booking.bookingType.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resource</p>
              <p className="text-lg">{booking.labResource.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Start Time</p>
              <p className="text-lg">
                {format(new Date(booking.startTime), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">End Time</p>
              <p className="text-lg">
                {format(new Date(booking.endTime), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-lg capitalize">{booking.status.toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Code</CardTitle>
            <CardDescription>
              Save this code to access your booking later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-4 py-2 font-mono text-lg">
                  {booking.accessCode}
                </code>
                <CopyAccessCodeButton accessCode={booking.accessCode} />
              </div>
              <p className="text-sm text-muted-foreground">
                You will need this code to view this booking again or access lab resources.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {booking.connectionInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Connection Information</CardTitle>
            <CardDescription>
              Use these credentials to access your lab resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectionInfoDisplay connectionInfo={booking.connectionInfo} />
          </CardContent>
        </Card>
      )}

      {canCancel && <CancelBookingButton bookingId={id} />}
    </div>
  )
}

