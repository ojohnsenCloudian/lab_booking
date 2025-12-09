import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        bookingPassword: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Note: In a real implementation, you might want to store the plain text password
    // temporarily or use a different approach. For now, we'll return an error indicating
    // that passwords cannot be retrieved (only reset).
    return NextResponse.json({
      error: "Password cannot be retrieved. Use reset-password endpoint to generate a new one.",
    });
  } catch (error) {
    console.error("Error fetching password:", error);
    return NextResponse.json(
      { error: "Failed to fetch password" },
      { status: 500 }
    );
  }
}

