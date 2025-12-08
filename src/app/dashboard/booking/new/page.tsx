import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BookingForm } from "@/components/booking-form"

export default async function NewBookingPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">New Booking</h1>
        <p className="text-muted-foreground">Book a time slot for lab access</p>
      </div>
      <BookingForm />
    </div>
  )
}

