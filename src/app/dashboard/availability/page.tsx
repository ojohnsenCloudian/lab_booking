"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

interface LabType {
  id: string;
  name: string;
  active: boolean;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  labTypeId: string;
}

type ViewMode = "day" | "week" | "month";

export default function AvailabilityPage() {
  const [labTypes, setLabTypes] = useState<LabType[]>([]);
  const [selectedLabType, setSelectedLabType] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const { toast } = useToast();

  useEffect(() => {
    fetchLabTypes();
  }, []);

  useEffect(() => {
    if (selectedLabType) {
      fetchAvailability();
    }
  }, [selectedLabType, currentDate, viewMode]);

  const fetchLabTypes = async () => {
    try {
      const response = await fetch("/api/admin/lab-types");
      const data = await response.json();
      setLabTypes(data.filter((lt: LabType) => lt.active));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lab types",
        variant: "destructive",
      });
    }
  };

  const fetchAvailability = async () => {
    if (!selectedLabType) return;

    let startDate: Date;
    let endDate: Date;

    if (viewMode === "day") {
      startDate = startOfDay(currentDate);
      endDate = endOfDay(currentDate);
    } else if (viewMode === "week") {
      startDate = startOfWeek(currentDate);
      endDate = endOfWeek(currentDate);
    } else {
      startDate = startOfMonth(currentDate);
      endDate = endOfMonth(currentDate);
    }

    try {
      const response = await fetch(
        `/api/bookings/availability?labTypeId=${selectedLabType}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch availability",
        variant: "destructive",
      });
    }
  };

  const getDaysToShow = () => {
    if (viewMode === "day") {
      return [currentDate];
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(currentDate);
      return eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) });
    } else {
      const monthStart = startOfMonth(currentDate);
      return eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
    }
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return (
        isSameDay(start, day) ||
        isSameDay(end, day) ||
        (start <= day && end >= day)
      );
    });
  };

  const isTimeSlotAvailable = (day: Date, hour: number) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const conflictingBooking = bookings.find((booking) => {
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      return (
        (bookingStart < slotEnd && bookingEnd > slotStart) ||
        (bookingEnd <= slotStart && bookingEnd > new Date(slotStart.getTime() - 2 * 60 * 60 * 1000)) ||
        (bookingStart >= slotEnd && bookingStart < new Date(slotEnd.getTime() + 2 * 60 * 60 * 1000))
      );
    });

    return !conflictingBooking && slotStart >= new Date();
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, direction === "next" ? 7 : -7));
    } else {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    }
  };

  const daysToShow = getDaysToShow();

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Availability</h1>
        <div className="flex gap-4 flex-wrap">
          <Select value={selectedLabType} onValueChange={setSelectedLabType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Lab Type" />
            </SelectTrigger>
            <SelectContent>
              {labTypes.map((labType) => (
                <SelectItem key={labType.id} value={labType.id}>
                  {labType.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigateDate("prev")}>
            Previous
          </Button>
          <Button variant="outline" onClick={() => navigateDate("next")}>
            Next
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {selectedLabType ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {viewMode === "day" && format(currentDate, "PPP")}
              {viewMode === "week" && `${format(startOfWeek(currentDate), "MMM d")} - ${format(endOfWeek(currentDate), "MMM d, yyyy")}`}
              {viewMode === "month" && format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <CardDescription>
              Green = Available, Red = Booked, Yellow = Maintenance Gap
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2">Time</th>
                    {daysToShow.map((day) => (
                      <th key={day.toISOString()} className="border p-2">
                        {format(day, "EEE M/d")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <tr key={hour}>
                      <td className="border p-2 text-sm">{hour}:00</td>
                      {daysToShow.map((day) => {
                        const isAvailable = isTimeSlotAvailable(day, hour);
                        const isPast = new Date(day).setHours(hour, 0, 0, 0) < Date.now();

                        return (
                          <td
                            key={`${day.toISOString()}-${hour}`}
                            className={`border p-1 ${
                              isPast
                                ? "bg-gray-200"
                                : isAvailable
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Link href="/dashboard/booking/new">
                <Button>Create New Booking</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Please select a Lab Type to view availability
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
