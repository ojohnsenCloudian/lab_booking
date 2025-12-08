"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { format, addHours } from "date-fns"

interface BookingType {
  id: string
  name: string
  description: string | null
}

export function BookingForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([])
  const [selectedBookingType, setSelectedBookingType] = useState<string>("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [duration, setDuration] = useState("4")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)

  useEffect(() => {
    fetchBookingTypes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Check for URL parameters (from availability view)
    const params = new URLSearchParams(window.location.search)
    const date = params.get("date")
    const time = params.get("time")
    const bookingType = params.get("bookingType")

    if (date) setStartDate(date)
    if (time) setStartTime(time)
    if (bookingType) setSelectedBookingType(bookingType)
  }, [])

  const fetchBookingTypes = async () => {
    try {
      const response = await fetch("/api/booking-types")
      if (response.ok) {
        const data = await response.json()
        setBookingTypes(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load booking types",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBookingType || !startDate || !startTime) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`)
      const endDateTime = addHours(startDateTime, parseInt(duration))

      // Check availability first
      const availabilityResponse = await fetch(
        `/api/bookings/availability?bookingTypeId=${selectedBookingType}&startTime=${startDateTime.toISOString()}&endTime=${endDateTime.toISOString()}`
      )

      if (!availabilityResponse.ok) {
        throw new Error("Failed to check availability")
      }

      const availability = await availabilityResponse.json()

      if (!availability.available) {
        toast({
          title: "Not Available",
          description: "The selected time slot is not available. Please choose a different time.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Create booking
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingTypeId: selectedBookingType,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create booking")
      }

      const booking = await response.json()

      toast({
        title: "Success",
        description: "Booking created successfully!",
      })

      router.push(`/dashboard/booking/${booking.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(0)
    return format(now, "yyyy-MM-dd'T'HH:mm")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Booking</CardTitle>
        <CardDescription>
          Select a booking type and time slot for your lab session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bookingType">Booking Type</Label>
            <Select
              value={selectedBookingType}
              onValueChange={setSelectedBookingType}
              disabled={isLoadingTypes || isLoading}
            >
              <SelectTrigger id="bookingType">
                <SelectValue placeholder="Select a booking type" />
              </SelectTrigger>
              <SelectContent>
                {bookingTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingTypes && (
              <p className="text-sm text-muted-foreground">Loading booking types...</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (hours)</Label>
            <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                  <SelectItem key={hours} value={hours.toString()}>
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Maximum booking duration is 8 hours
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isLoadingTypes}>
            {isLoading ? "Creating booking..." : "Create Booking"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

