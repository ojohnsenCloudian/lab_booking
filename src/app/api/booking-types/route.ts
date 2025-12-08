import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bookingTypes = await prisma.bookingType.findMany({
      where: {
        isActive: true,
      },
      include: {
        resources: {
          include: {
            labResource: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
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

