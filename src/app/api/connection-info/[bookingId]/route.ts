import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bookingId } = await params

    // Verify user owns the booking or is admin
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        userId: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (session.user.role !== "ADMIN" && booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const connectionInfo = await prisma.connectionInfo.findUnique({
      where: { bookingId },
      include: {
        template: true,
      },
    })

    if (!connectionInfo) {
      return NextResponse.json(
        { error: "Connection info not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(connectionInfo)
  } catch (error) {
    console.error("Error fetching connection info:", error)
    return NextResponse.json(
      { error: "Failed to fetch connection info" },
      { status: 500 }
    )
  }
}

