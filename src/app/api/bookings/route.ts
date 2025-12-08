import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateBooking, generateAccessCode } from "@/lib/booking-rules"
import { z } from "zod"

const createBookingSchema = z.object({
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
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id
    }

    if (bookingTypeId) {
      where.bookingTypeId = bookingTypeId
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
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
        bookingType: {
          select: {
            id: true,
            name: true,
          },
        },
        labResource: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createBookingSchema.parse(body)

    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    // Validate booking
    const validation = await validateBooking(
      session.user.id,
      data.bookingTypeId,
      startTime,
      endTime
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Generate access code
    const accessCode = generateAccessCode()

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        bookingTypeId: data.bookingTypeId,
        labResourceId: validation.availableResourceId!,
        startTime,
        endTime,
        accessCode,
        status: "UPCOMING",
      },
      include: {
        bookingType: true,
        labResource: true,
      },
    })

    // Update user's last booking date
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastBookingDate: new Date() },
    })

    // Generate connection info directly from resource metadata
    const labResource = await prisma.labResource.findUnique({
      where: { id: validation.availableResourceId! },
      select: { 
        connectionMetadata: true,
        resourceType: true,
        name: true,
      },
    })

    if (labResource && labResource.connectionMetadata) {
      const resourceMetadata = labResource.connectionMetadata as Record<string, any>
      const resourceType = labResource.resourceType || "SSH"
      const values: Record<string, any> = {}

      // Generate connection info from resource metadata
      // For each field in metadata, use it directly or generate per-booking values
      for (const [key, value] of Object.entries(resourceMetadata)) {
        const keyLower = key.toLowerCase()
        
        // Generate passwords/secrets/api_keys per booking
        if (keyLower.includes("password") || keyLower.includes("secret") || keyLower.includes("api_key")) {
          values[key] = generateAccessCode().substring(0, 12)
        } else {
          // Use the value from resource metadata
          values[key] = value
        }
      }

      // Add defaults based on resource type if not in metadata
      if (resourceType === "SSH") {
        if (!values.host && !values.ip) {
          values.host = `lab-${validation.availableResourceId!.substring(0, 8)}.example.com`
        }
        if (!values.port) {
          values.port = 22
        }
        if (!values.username) {
          values.username = "labuser"
        }
        if (!values.password) {
          values.password = generateAccessCode().substring(0, 12)
        }
      } else if (resourceType === "RDP") {
        if (!values.host && !values.ip) {
          values.host = `lab-${validation.availableResourceId!.substring(0, 8)}.example.com`
        }
        if (!values.port) {
          values.port = 3389
        }
        if (!values.username) {
          values.username = "labuser"
        }
        if (!values.password) {
          values.password = generateAccessCode().substring(0, 12)
        }
      } else if (resourceType === "WEB_URL") {
        if (!values.url && !values.base_url) {
          values.url = `https://lab-${validation.availableResourceId!.substring(0, 8)}.example.com`
        }
      } else if (resourceType === "VPN") {
        if (!values.server) {
          values.server = `vpn-${validation.availableResourceId!.substring(0, 8)}.example.com`
        }
      } else if (resourceType === "API_KEY") {
        if (!values.api_key) {
          values.api_key = generateAccessCode().substring(0, 12)
        }
        if (!values.endpoint) {
          values.endpoint = `https://api-${validation.availableResourceId!.substring(0, 8)}.example.com`
        }
      }

      // Only create connection info if we have values
      if (Object.keys(values).length > 0) {
        await prisma.connectionInfo.create({
          data: {
            bookingId: booking.id,
            values,
          },
        })
      }
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating booking:", error)
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    )
  }
}

