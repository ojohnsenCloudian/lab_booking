import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const labTypeId = searchParams.get("labTypeId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!labTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "labTypeId, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get all active bookings for this lab type in the date range
    const bookings = await prisma.booking.findMany({
      where: {
        labTypeId,
        status: BookingStatus.ACTIVE,
        OR: [
          {
            AND: [
              { startTime: { gte: start } },
              { startTime: { lte: end } },
            ],
          },
          {
            AND: [
              { endTime: { gte: start } },
              { endTime: { lte: end } },
            ],
          },
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
