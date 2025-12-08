import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignResourceSchema = z.object({
  labResourceId: z.string(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: bookingTypeId } = await params
    const body = await request.json()
    const { labResourceId } = assignResourceSchema.parse(body)

    const mapping = await prisma.bookingTypeResource.create({
      data: {
        bookingTypeId,
        labResourceId,
      },
      include: {
        labResource: true,
      },
    })

    return NextResponse.json(mapping, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error assigning resource:", error)
    return NextResponse.json(
      { error: "Failed to assign resource" },
      { status: 500 }
    )
  }
}

