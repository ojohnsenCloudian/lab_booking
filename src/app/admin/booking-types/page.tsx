import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BookingTypesManagement } from "@/components/admin/booking-types-management"

export default async function AdminBookingTypesPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Booking Types</h1>
        <p className="text-muted-foreground">Create and manage booking types</p>
      </div>
      <BookingTypesManagement />
    </div>
  )
}

