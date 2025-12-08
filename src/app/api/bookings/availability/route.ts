import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { findAvailableResource } from "@/lib/booking-rules"
import { z } from "zod"

const availabilitySchema = z.object({
  bookingTypeId: z.string(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const bookingTypeId = searchParams.get("bookingTypeId")
    const startTime = searchParams.get("startTime")
    const endTime = searchParams.get("endTime")

    if (!bookingTypeId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    const availableResourceId = await findAvailableResource(
      bookingTypeId,
      new Date(startTime),
      new Date(endTime)
    )

    return NextResponse.json({
      available: !!availableResourceId,
      resourceId: availableResourceId,
    })
  } catch (error) {
    console.error("Error checking availability:", error)
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    )
  }
}

