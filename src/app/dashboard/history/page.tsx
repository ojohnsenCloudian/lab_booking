import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { format } from "date-fns";

export default async function HistoryPage() {
  const session = await requireAuth();

  const bookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      labType: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Booking History</h1>
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No bookings found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <CardTitle>{booking.labType.name}</CardTitle>
                <CardDescription>
                  {format(new Date(booking.startTime), "PPP p")} -{" "}
                  {format(new Date(booking.endTime), "p")} • Status: {booking.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {booking.notes && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    Notes: {booking.notes}
                  </p>
                )}
                <Link href={`/dashboard/booking/${booking.id}`}>
                  <button className="text-primary hover:underline">View Details</button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

