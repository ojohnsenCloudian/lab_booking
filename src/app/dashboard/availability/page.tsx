import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AvailabilityView } from "@/components/availability-view"

export default async function AvailabilityPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Slots</h1>
        <p className="text-muted-foreground">View available lab booking slots</p>
      </div>
      <AvailabilityView />
    </div>
  )
}

