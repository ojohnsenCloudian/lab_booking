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

    // Generate connection info if template exists
    const bookingType = await prisma.bookingType.findUnique({
      where: { id: data.bookingTypeId },
      include: {
        connectionTemplates: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    if (bookingType?.connectionTemplates && bookingType.connectionTemplates.length > 0) {
      const template = bookingType.connectionTemplates[0]
      const values: Record<string, any> = {}

      // Generate values based on template fields
      const fields = template.fields as Record<string, any>
      for (const [key, field] of Object.entries(fields)) {
        if (field.type === "string") {
          if (key.toLowerCase().includes("password") || key.toLowerCase().includes("secret")) {
            values[key] = generateAccessCode().substring(0, 12)
          } else if (key.toLowerCase().includes("host")) {
            values[key] = `lab-${validation.availableResourceId!.substring(0, 8)}.example.com`
          } else if (key.toLowerCase().includes("url")) {
            values[key] = `https://lab-${validation.availableResourceId!.substring(0, 8)}.example.com`
          } else {
            values[key] = field.default || `lab-${key}`
          }
        } else if (field.type === "number") {
          values[key] = field.default || 22
        } else {
          values[key] = field.default || false
        }
      }

      await prisma.connectionInfo.create({
        data: {
          bookingId: booking.id,
          templateId: template.id,
          values,
        },
      })
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

