import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { validateBooking, generateBookingPassword } from "@/lib/booking-rules";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createBookingSchema = z.object({
  labTypeId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const labTypeId = searchParams.get("labTypeId");
    const status = searchParams.get("status");

    const where: any = {};
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }
    if (labTypeId) where.labTypeId = labTypeId;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        labType: true,
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createBookingSchema.parse(body);

    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    // Validate booking
    const validation = await validateBooking(
      session.user.id,
      data.labTypeId,
      startTime,
      endTime
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate booking password
    const bookingPassword = generateBookingPassword();
    const hashedPassword = await bcrypt.hash(bookingPassword, 10);

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        labTypeId: data.labTypeId,
        startTime,
        endTime,
        bookingPassword: hashedPassword,
        notes: data.notes,
        status: "ACTIVE",
      },
      include: {
        labType: true,
      },
    });

    return NextResponse.json(
      { booking, password: bookingPassword },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
