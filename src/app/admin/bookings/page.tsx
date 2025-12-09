"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  user: {
    id: string;
    email: string;
  };
  labType: {
    id: string;
    name: string;
  };
}

interface LabType {
  id: string;
  name: string;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labTypes, setLabTypes] = useState<LabType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [filterLabType, setFilterLabType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
    fetchLabTypes();
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [filterLabType, filterStatus]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (filterLabType) params.append("labTypeId", filterLabType);
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(`/api/bookings?${params.toString()}`);
      const data = await response.json();
      
      let filtered = data;
      if (searchEmail) {
        filtered = filtered.filter((b: Booking) =>
          b.user.email.toLowerCase().includes(searchEmail.toLowerCase())
        );
      }
      
      setBookings(filtered);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTypes = async () => {
    try {
      const response = await fetch("/api/admin/lab-types");
      const data = await response.json();
      setLabTypes(data);
    } catch (error) {
      // Ignore
    }
  };

  const handleBulkCancel = async () => {
    if (selectedBookings.length === 0) return;
    if (!confirm(`Cancel ${selectedBookings.length} booking(s)?`)) return;

    try {
      await Promise.all(
        selectedBookings.map((id) =>
          fetch(`/api/bookings/${id}`, { method: "DELETE" })
        )
      );

      toast({
        title: "Success",
        description: `${selectedBookings.length} booking(s) cancelled`,
      });

      setSelectedBookings([]);
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel bookings",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterLabType) params.append("labTypeId", filterLabType);
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(`/api/bookings/export?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export bookings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <div className="flex gap-2">
          {selectedBookings.length > 0 && (
            <Button variant="destructive" onClick={handleBulkCancel}>
              Cancel Selected ({selectedBookings.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search by email..."
          value={searchEmail}
          onChange={(e) => {
            setSearchEmail(e.target.value);
            fetchBookings();
          }}
          className="max-w-xs"
        />
        <Select value={filterLabType} onValueChange={setFilterLabType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Lab Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Lab Types</SelectItem>
            {labTypes.map((lt) => (
              <SelectItem key={lt.id} value={lt.id}>
                {lt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{booking.labType.name}</CardTitle>
                  <CardDescription>
                    {booking.user.email} • {format(new Date(booking.startTime), "PPP p")} -{" "}
                    {format(new Date(booking.endTime), "p")} • Status: {booking.status}
                  </CardDescription>
                </div>
                <input
                  type="checkbox"
                  checked={selectedBookings.includes(booking.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedBookings([...selectedBookings, booking.id]);
                    } else {
                      setSelectedBookings(
                        selectedBookings.filter((id) => id !== booking.id)
                      );
                    }
                  }}
                />
              </div>
            </CardHeader>
            <CardContent>
              {booking.notes && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Notes: {booking.notes}
                </p>
              )}
              <Link href={`/admin/bookings/${booking.id}`}>
                <button className="text-primary hover:underline">View Details</button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
