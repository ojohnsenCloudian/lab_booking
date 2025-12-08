"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addHours, isSameDay, isBefore, isAfter } from "date-fns"
import Link from "next/link"

interface BookingType {
  id: string
  name: string
  description: string | null
}

interface Booking {
  id: string
  startTime: string
  endTime: string
  labResourceId: string
  labResource: {
    id: string
    name: string
  }
  bookingType: {
    id: string
    name: string
  }
  status: string
}

export function AvailabilityView() {
  const { toast } = useToast()
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([])
  const [selectedBookingType, setSelectedBookingType] = useState<string>("")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBookingTypes()
  }, [])

  useEffect(() => {
    if (selectedBookingType) {
      fetchBookings()
    }
  }, [selectedBookingType, currentWeek])

  const fetchBookingTypes = async () => {
    try {
      const response = await fetch("/api/booking-types")
      if (response.ok) {
        const data = await response.json()
        setBookingTypes(data)
        if (data.length > 0) {
          setSelectedBookingType(data[0].id)
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load booking types",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBookings = async () => {
    if (!selectedBookingType) return

    setIsLoading(true)
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

      const response = await fetch(
        `/api/bookings?bookingTypeId=${selectedBookingType}&startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    })
  }

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour)
    }
    return slots
  }

  const isSlotBooked = (day: Date, hour: number) => {
    const slotStart = new Date(day)
    slotStart.setHours(hour, 0, 0, 0)
    const slotEnd = addHours(slotStart, 1)

    return bookings.some((booking) => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      
      // Check if slot overlaps with booking (including 2-hour buffer)
      const bufferStart = addHours(bookingStart, -2)
      const bufferEnd = addHours(bookingEnd, 2)

      return (
        (slotStart >= bufferStart && slotStart < bufferEnd) ||
        (slotEnd > bufferStart && slotEnd <= bufferEnd) ||
        (slotStart <= bufferStart && slotEnd >= bufferEnd)
      )
    })
  }

  const isSlotAvailable = (day: Date, hour: number) => {
    const slotStart = new Date(day)
    slotStart.setHours(hour, 0, 0, 0)
    
    // Don't show past slots
    if (isBefore(slotStart, new Date())) {
      return false
    }

    return !isSlotBooked(day, hour)
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeek((prev) => addDays(prev, direction === "next" ? 7 : -7))
  }

  if (isLoading && bookings.length === 0) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={selectedBookingType}
            onValueChange={setSelectedBookingType}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select booking type" />
            </SelectTrigger>
            <SelectContent>
              {bookingTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
        </div>

        <Link href="/dashboard/booking/new">
          <Button>New Booking</Button>
        </Link>
      </div>

      {viewMode === "calendar" && selectedBookingType && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
                {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d, yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                  ← Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentWeek(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                  Next →
                </Button>
              </div>
            </div>
            <CardDescription>
              Green = Available, Red = Booked/Buffer Period, Gray = Past
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                <div className="grid grid-cols-8 gap-1">
                  <div className="font-medium p-2 text-sm">Time</div>
                  {getWeekDays().map((day) => (
                    <div key={day.toISOString()} className="font-medium p-2 text-sm text-center">
                      <div>{format(day, "EEE")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, "MMM d")}
                      </div>
                    </div>
                  ))}
                </div>
                {getTimeSlots().map((hour) => (
                  <div key={hour} className="grid grid-cols-8 gap-1">
                    <div className="p-2 text-xs text-muted-foreground">
                      {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                    </div>
                    {getWeekDays().map((day) => {
                      const slotStart = new Date(day)
                      slotStart.setHours(hour, 0, 0, 0)
                      const isPast = isBefore(slotStart, new Date())
                      const isAvailable = isSlotAvailable(day, hour)
                      const isBooked = isSlotBooked(day, hour)

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className={`p-1 text-xs border rounded ${
                            isPast
                              ? "bg-muted opacity-50"
                              : isBooked
                              ? "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700"
                              : isAvailable
                              ? "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700 cursor-pointer hover:bg-green-200 dark:hover:bg-green-800"
                              : "bg-muted"
                          }`}
                          title={
                            isPast
                              ? "Past"
                              : isBooked
                              ? "Booked or buffer period"
                              : isAvailable
                              ? "Available"
                              : "Unavailable"
                          }
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "list" && selectedBookingType && (
        <Card>
          <CardHeader>
            <CardTitle>Available Slots</CardTitle>
            <CardDescription>
              List of available booking slots for the selected booking type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getWeekDays().map((day) => {
                const daySlots = getTimeSlots()
                  .filter((hour) => {
                    const slotStart = new Date(day)
                    slotStart.setHours(hour, 0, 0, 0)
                    return isSlotAvailable(day, hour)
                  })
                  .map((hour) => {
                    const slotStart = new Date(day)
                    slotStart.setHours(hour, 0, 0, 0)
                    const slotEnd = addHours(slotStart, 1)
                    return { start: slotStart, end: slotEnd }
                  })

                if (daySlots.length === 0) {
                  return null
                }

                return (
                  <div key={day.toISOString()} className="border-b pb-4 last:border-0">
                    <h3 className="font-medium mb-2">
                      {format(day, "EEEE, MMMM d, yyyy")}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {daySlots.map((slot, idx) => (
                        <Link
                          key={idx}
                          href={`/dashboard/booking/new?date=${format(slot.start, "yyyy-MM-dd")}&time=${format(slot.start, "HH:mm")}&bookingType=${selectedBookingType}`}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            {format(slot.start, "HH:mm")} - {format(slot.end, "HH:mm")}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
              {getWeekDays().every((day) => {
                const daySlots = getTimeSlots().filter((hour) =>
                  isSlotAvailable(day, hour)
                )
                return daySlots.length === 0
              }) && (
                <p className="text-muted-foreground text-center py-8">
                  No available slots found for this week. Try selecting a different week or booking
                  type.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedBookingType && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Please select a booking type to view availability
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

