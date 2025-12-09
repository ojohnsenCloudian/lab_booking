import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  maxDurationHours: z.number().positive().optional().nullable(),
  active: z.boolean().optional(),
  resourceIds: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const labType = await prisma.labType.findUnique({
      where: { id },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    if (!labType) {
      return NextResponse.json(
        { error: "Lab Type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(labType);
  } catch (error) {
    console.error("Error fetching lab type:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab type" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    const body = await request.json();
    const data = updateSchema.parse(body);

    // Update lab type
    const labType = await prisma.labType.update({
      where: { id },
      data: {
        name: data.name,
        maxDurationHours: data.maxDurationHours,
        active: data.active,
      },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    // Update resources if provided
    if (data.resourceIds !== undefined) {
      // Delete existing relationships
      await prisma.labTypeResource.deleteMany({
        where: { labTypeId: id },
      });

      // Create new relationships
      if (data.resourceIds.length > 0) {
        await prisma.labTypeResource.createMany({
          data: data.resourceIds.map((resourceId) => ({
            labTypeId: id,
            resourceId,
          })),
        });
      }

      // Fetch updated lab type
      const updated = await prisma.labType.findUnique({
        where: { id },
        include: {
          resources: {
            include: {
              resource: true,
            },
          },
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(labType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating lab type:", error);
    return NextResponse.json(
      { error: "Failed to update lab type" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await requireAdmin();

    await prisma.labType.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lab Type deleted" });
  } catch (error) {
    console.error("Error deleting lab type:", error);
    return NextResponse.json(
      { error: "Failed to delete lab type" },
      { status: 500 }
    );
  }
}

