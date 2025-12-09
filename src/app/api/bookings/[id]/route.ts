import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { validateBooking } from "@/lib/booking-rules";
import { z } from "zod";

const updateBookingSchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  labTypeId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
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

    // Users can only view their own bookings unless admin
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Only admins can modify bookings
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can modify bookings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateBookingSchema.parse(body);

    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes;

    let startTime = booking.startTime;
    let endTime = booking.endTime;
    let labTypeId = booking.labTypeId;

    if (data.startTime) startTime = new Date(data.startTime);
    if (data.endTime) endTime = new Date(data.endTime);
    if (data.labTypeId) labTypeId = data.labTypeId;

    // Validate if time or lab type changed
    if (data.startTime || data.endTime || data.labTypeId) {
      const validation = await validateBooking(
        booking.userId,
        labTypeId,
        startTime,
        endTime,
        id
      );

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      updateData.startTime = startTime;
      updateData.endTime = endTime;
      updateData.labTypeId = labTypeId;
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        labType: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireAuth();

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Users can only cancel their own bookings, admins can cancel any
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ message: "Booking cancelled" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
