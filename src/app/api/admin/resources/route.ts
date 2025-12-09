import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const resourceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["SSH", "WEB_APP", "RDP", "VPN"]),
  config: z.record(z.any()),
  active: z.boolean().optional(),
  status: z.enum(["ONLINE", "OFFLINE", "MAINTENANCE"]).optional(),
});

export async function GET() {
  try {
    await requireAdmin();

    const resources = await prisma.labResource.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = resourceSchema.parse(body);

    const resource = await prisma.labResource.create({
      data: {
        name: data.name,
        type: data.type,
        config: data.config,
        active: data.active ?? true,
        status: data.status ?? "ONLINE",
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
