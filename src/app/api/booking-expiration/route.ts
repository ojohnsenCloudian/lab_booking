import { NextResponse } from "next/server";
import { expireBookings } from "@/lib/booking-rules";

export async function POST() {
  try {
    await expireBookings();
    return NextResponse.json({ message: "Bookings expired" });
  } catch (error) {
    console.error("Error expiring bookings:", error);
    return NextResponse.json(
      { error: "Failed to expire bookings" },
      { status: 500 }
    );
  }
}

