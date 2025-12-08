import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bookingTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingTypes = await prisma.bookingType.findMany({
      include: {
        resources: {
          include: {
            labResource: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(bookingTypes)
  } catch (error) {
    console.error("Error fetching booking types:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking types" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = bookingTypeSchema.parse(body)

    const bookingType = await prisma.bookingType.create({
      data,
    })

    return NextResponse.json(bookingType, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating booking type:", error)
    return NextResponse.json(
      { error: "Failed to create booking type" },
      { status: 500 }
    )
  }
}

