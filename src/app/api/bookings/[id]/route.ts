import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        bookingType: true,
        labResource: true,
        connectionInfo: {
          include: {
            template: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Users can only view their own bookings unless they're admin
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Users can only cancel their own bookings unless they're admin
    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Can't cancel completed bookings
    if (booking.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot cancel completed bookings" },
        { status: 400 }
      )
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error cancelling booking:", error)
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    )
  }
}

