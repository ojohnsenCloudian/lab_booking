import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  await requireAdmin();

  const [resourcesCount, labTypesCount, usersCount, bookingsCount] = await Promise.all([
    prisma.labResource.count(),
    prisma.labType.count(),
    prisma.user.count(),
    prisma.booking.count(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Resources</CardTitle>
            <CardDescription>Total lab resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourcesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lab Types</CardTitle>
            <CardDescription>Total lab types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labTypesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Total users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Total bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
