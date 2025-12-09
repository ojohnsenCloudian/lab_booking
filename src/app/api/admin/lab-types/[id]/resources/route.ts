import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addResourceSchema = z.object({
  resourceId: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { resourceId } = addResourceSchema.parse(body);

    const labTypeResource = await prisma.labTypeResource.create({
      data: {
        labTypeId: id,
        resourceId,
      },
      include: {
        resource: true,
      },
    });

    return NextResponse.json(labTypeResource, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error adding resource to lab type:", error);
    return NextResponse.json(
      { error: "Failed to add resource" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json(
        { error: "resourceId is required" },
        { status: 400 }
      );
    }

    await prisma.labTypeResource.deleteMany({
      where: {
        labTypeId: id,
        resourceId,
      },
    });

    return NextResponse.json({ message: "Resource removed" });
  } catch (error) {
    console.error("Error removing resource:", error);
    return NextResponse.json(
      { error: "Failed to remove resource" },
      { status: 500 }
    );
  }
}

