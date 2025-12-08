import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const bookingTypeId = searchParams.get("bookingTypeId")
    const resourceId = searchParams.get("resourceId")
    const userId = searchParams.get("userId")

    const where: any = {}

    if (bookingTypeId) {
      where.bookingTypeId = bookingTypeId
    }

    if (resourceId) {
      where.labResourceId = resourceId
    }

    if (userId) {
      where.userId = userId
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        bookingType: true,
        labResource: true,
      },
      orderBy: {
        startTime: "desc",
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    )
  }
}

