import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const labTypeId = searchParams.get("labTypeId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: any = {};
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }
    if (labTypeId) where.labTypeId = labTypeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
          },
        },
        labType: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    // Generate CSV
    const headers = [
      "ID",
      "User Email",
      "Lab Type",
      "Start Time",
      "End Time",
      "Status",
      "Notes",
      "Created At",
    ];

    const rows = bookings.map((booking) => [
      booking.id,
      booking.user.email,
      booking.labType.name,
      format(new Date(booking.startTime), "yyyy-MM-dd HH:mm:ss"),
      format(new Date(booking.endTime), "yyyy-MM-dd HH:mm:ss"),
      booking.status,
      booking.notes || "",
      format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bookings-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting bookings:", error);
    return NextResponse.json(
      { error: "Failed to export bookings" },
      { status: 500 }
    );
  }
}

