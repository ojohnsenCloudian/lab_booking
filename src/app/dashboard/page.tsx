import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookingStatus } from "@prisma/client";
import { format } from "date-fns";

export default async function DashboardPage() {
  const session = await requireAuth();

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      status: BookingStatus.ACTIVE,
      startTime: {
        gte: new Date(),
      },
    },
    include: {
      labType: true,
    },
    orderBy: {
      startTime: "asc",
    },
    take: 5,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <div className="mb-6">
        <Link href="/dashboard/booking/new">
          <Button>Create New Booking</Button>
        </Link>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Bookings</h2>
        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No upcoming bookings</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <CardTitle>{booking.labType.name}</CardTitle>
                  <CardDescription>
                    {format(new Date(booking.startTime), "PPP p")} -{" "}
                    {format(new Date(booking.endTime), "p")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/booking/${booking.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
