import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const session = await requireAuth();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        labType: {
          include: {
            resources: {
              include: {
                resource: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);

    // Admins can view connection info even after booking ends
    // Users can only view when booking is active (startTime <= now < endTime)
    if (
      session.user.role !== "ADMIN" &&
      (now < startTime || now >= endTime)
    ) {
      return NextResponse.json(
        { error: "Connection info is not available yet or booking has ended" },
        { status: 403 }
      );
    }

    // Log access
    await prisma.accessLog.create({
      data: {
        bookingId,
        userId: session.user.id,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      },
    });

    // Return connection info for all resources
    const connectionInfo = booking.labType.resources.map((lt) => ({
      resourceId: lt.resource.id,
      resourceName: lt.resource.name,
      resourceType: lt.resource.type,
      config: lt.resource.config,
    }));

    return NextResponse.json({ connectionInfo });
  } catch (error) {
    console.error("Error fetching connection info:", error);
    return NextResponse.json(
      { error: "Failed to fetch connection info" },
      { status: 500 }
    );
  }
}
