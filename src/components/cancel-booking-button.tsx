"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel booking")
      }

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Danger Zone</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          onClick={handleCancel}
          disabled={isLoading}
        >
          {isLoading ? "Cancelling..." : "Cancel Booking"}
        </Button>
      </CardContent>
    </Card>
  )
}

