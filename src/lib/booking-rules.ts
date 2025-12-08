import { prisma } from "./prisma"
import { addHours, addDays, isBefore, isAfter, differenceInHours } from "date-fns"

const MAX_BOOKING_DURATION_HOURS = 8
const COOLDOWN_DAYS = 3
const BUFFER_HOURS = 2

export interface BookingValidationResult {
  isValid: boolean
  error?: string
  availableResourceId?: string
}

/**
 * Validates if a booking duration is within the maximum allowed (8 hours)
 */
export function validateBookingDuration(startTime: Date, endTime: Date): boolean {
  const durationHours = differenceInHours(endTime, startTime)
  return durationHours > 0 && durationHours <= MAX_BOOKING_DURATION_HOURS
}

/**
 * Checks if user has completed cooldown period (3 days) since last booking
 */
export async function checkCooldownPeriod(userId: string): Promise<{ isValid: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastBookingDate: true },
  })

  if (!user || !user.lastBookingDate) {
    return { isValid: true }
  }

  const cooldownEndDate = addDays(user.lastBookingDate, COOLDOWN_DAYS)
  const now = new Date()

  if (isBefore(now, cooldownEndDate)) {
    const daysRemaining = Math.ceil(
      (cooldownEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      isValid: false,
      error: `You must wait ${daysRemaining} more day(s) before booking again. Cooldown period is ${COOLDOWN_DAYS} days.`,
    }
  }

  return { isValid: true }
}

/**
 * Checks if a time slot conflicts with existing bookings on a resource
 * Includes 2-hour buffer before and after each booking
 */
export async function checkResourceAvailability(
  resourceId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<boolean> {
  // Calculate buffer times
  const bufferStart = addHours(startTime, -BUFFER_HOURS)
  const bufferEnd = addHours(endTime, BUFFER_HOURS)

  // Find conflicting bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      labResourceId: resourceId,
      status: {
        in: ["UPCOMING", "ACTIVE"],
      },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        // Booking starts during our time slot (including buffers)
        {
          startTime: {
            gte: bufferStart,
            lte: bufferEnd,
          },
        },
        // Booking ends during our time slot (including buffers)
        {
          endTime: {
            gte: bufferStart,
            lte: bufferEnd,
          },
        },
        // Booking completely encompasses our time slot
        {
          startTime: { lte: bufferStart },
          endTime: { gte: bufferEnd },
        },
      ],
    },
  })

  return conflictingBookings.length === 0
}

/**
 * Finds an available resource within a booking type for the given time slot
 */
export async function findAvailableResource(
  bookingTypeId: string,
  startTime: Date,
  endTime: Date
): Promise<string | null> {
  // Get all resources for this booking type
  const bookingType = await prisma.bookingType.findUnique({
    where: { id: bookingTypeId },
    include: {
      resources: {
        include: {
          labResource: true,
        },
      },
    },
  })

  if (!bookingType) {
    return null
  }

  // Check each resource for availability
  for (const resourceMapping of bookingType.resources) {
    const resource = resourceMapping.labResource
    if (!resource.isActive) {
      continue
    }

    const isAvailable = await checkResourceAvailability(
      resource.id,
      startTime,
      endTime
    )

    if (isAvailable) {
      return resource.id
    }
  }

  return null
}

/**
 * Comprehensive booking validation
 */
export async function validateBooking(
  userId: string,
  bookingTypeId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<BookingValidationResult> {
  // Validate duration
  if (!validateBookingDuration(startTime, endTime)) {
    return {
      isValid: false,
      error: `Booking duration cannot exceed ${MAX_BOOKING_DURATION_HOURS} hours`,
    }
  }

  // Validate start time is in the future
  if (isBefore(startTime, new Date())) {
    return {
      isValid: false,
      error: "Booking start time must be in the future",
    }
  }

  // Check cooldown period
  const cooldownCheck = await checkCooldownPeriod(userId)
  if (!cooldownCheck.isValid) {
    return {
      isValid: false,
      error: cooldownCheck.error,
    }
  }

  // Find available resource
  const availableResourceId = await findAvailableResource(
    bookingTypeId,
    startTime,
    endTime
  )

  if (!availableResourceId) {
    return {
      isValid: false,
      error: "No available resources for the selected time slot. All resources are booked or have buffer periods.",
    }
  }

  // Double-check the specific resource availability
  const isAvailable = await checkResourceAvailability(
    availableResourceId,
    startTime,
    endTime,
    excludeBookingId
  )

  if (!isAvailable) {
    return {
      isValid: false,
      error: "Resource is no longer available for the selected time slot",
    }
  }

  return {
    isValid: true,
    availableResourceId,
  }
}

/**
 * Generates a secure access code for a booking
 */
export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding confusing chars
  let code = ""
  for (let i = 0; i < 16; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

