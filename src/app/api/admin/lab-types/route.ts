import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const labTypeSchema = z.object({
  name: z.string().min(1),
  maxDurationHours: z.number().positive().optional(),
  active: z.boolean().optional(),
  resourceIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    const labTypes = await prisma.labType.findMany({
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labTypes);
  } catch (error) {
    console.error("Error fetching lab types:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = labTypeSchema.parse(body);

    const labType = await prisma.labType.create({
      data: {
        name: data.name,
        maxDurationHours: data.maxDurationHours,
        active: data.active ?? true,
        resources: data.resourceIds
          ? {
              create: data.resourceIds.map((resourceId) => ({
                resourceId,
              })),
            }
          : undefined,
      },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    return NextResponse.json(labType, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating lab type:", error);
    return NextResponse.json(
      { error: "Failed to create lab type" },
      { status: 500 }
    );
  }
}

