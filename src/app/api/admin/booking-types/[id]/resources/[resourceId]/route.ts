import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: bookingTypeId, resourceId } = await params

    await prisma.bookingTypeResource.delete({
      where: {
        bookingTypeId_labResourceId: {
          bookingTypeId,
          labResourceId: resourceId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing resource:", error)
    return NextResponse.json(
      { error: "Failed to remove resource" },
      { status: 500 }
    )
  }
}

