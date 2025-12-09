import { prisma } from "./prisma";
import { BookingStatus } from "@prisma/client";

export { generateBookingPassword } from "./utils";

const MINIMUM_DURATION_HOURS = 1;
const MAINTENANCE_GAP_HOURS = 2;
const USER_COOLDOWN_DAYS = 3;

export interface BookingValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateBooking(
  userId: string,
  labTypeId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<BookingValidationResult> {
  // Check minimum duration (1 hour)
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  if (durationHours < MINIMUM_DURATION_HOURS) {
    return {
      valid: false,
      error: `Minimum booking duration is ${MINIMUM_DURATION_HOURS} hour(s)`,
    };
  }

  // Check start time is not in the past
  if (startTime < new Date()) {
    return {
      valid: false,
      error: "Cannot create bookings in the past",
    };
  }

  // Get Lab Type with max duration
  const labType = await prisma.labType.findUnique({
    where: { id: labTypeId },
  });

  if (!labType) {
    return {
      valid: false,
      error: "Lab Type not found",
    };
  }

  if (!labType.active) {
    return {
      valid: false,
      error: "Lab Type is not active",
    };
  }

  // Check max duration if configured
  if (labType.maxDurationHours && durationHours > labType.maxDurationHours) {
    return {
      valid: false,
      error: `Maximum booking duration is ${labType.maxDurationHours} hour(s)`,
    };
  }

  // Check if any resources are offline
  const resources = await prisma.labTypeResource.findMany({
    where: { labTypeId },
    include: { resource: true },
  });

  const offlineResources = resources.filter(
    (lt) => !lt.resource.active || lt.resource.status === "OFFLINE"
  );

  if (offlineResources.length > 0) {
    return {
      valid: false,
      error: "Some resources in this Lab Type are offline",
    };
  }

  // Check for exclusive booking conflicts (same Lab Type)
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      labTypeId,
      status: BookingStatus.ACTIVE,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gte: endTime } },
          ],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    },
  });

  if (conflictingBooking) {
    return {
      valid: false,
      error: "This Lab Type is already booked for the selected time",
    };
  }

  // Check 2-hour maintenance gap before
  const gapBeforeEnd = new Date(startTime.getTime() - MAINTENANCE_GAP_HOURS * 60 * 60 * 1000);
  const bookingBefore = await prisma.booking.findFirst({
    where: {
      labTypeId,
      status: BookingStatus.ACTIVE,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      endTime: {
        gt: gapBeforeEnd,
        lte: startTime,
      },
    },
  });

  if (bookingBefore) {
    return {
      valid: false,
      error: `Must have ${MAINTENANCE_GAP_HOURS} hour gap before booking for maintenance`,
    };
  }

  // Check 2-hour maintenance gap after
  const gapAfterStart = new Date(endTime.getTime() + MAINTENANCE_GAP_HOURS * 60 * 60 * 1000);
  const bookingAfter = await prisma.booking.findFirst({
    where: {
      labTypeId,
      status: BookingStatus.ACTIVE,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      startTime: {
        gte: endTime,
        lt: gapAfterStart,
      },
    },
  });

  if (bookingAfter) {
    return {
      valid: false,
      error: `Must have ${MAINTENANCE_GAP_HOURS} hour gap after booking for maintenance`,
    };
  }

  // Check 3-day cooldown for user
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - USER_COOLDOWN_DAYS);

  const recentBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: {
        in: [BookingStatus.ACTIVE, BookingStatus.EXPIRED],
      },
      createdAt: {
        gte: cooldownDate,
      },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (recentBooking) {
    return {
      valid: false,
      error: `Must wait ${USER_COOLDOWN_DAYS} days between bookings`,
    };
  }

  return { valid: true };
}

export async function expireBookings() {
  const now = new Date();
  await prisma.booking.updateMany({
    where: {
      status: BookingStatus.ACTIVE,
      endTime: {
        lt: now,
      },
    },
    data: {
      status: BookingStatus.EXPIRED,
    },
  });
}
