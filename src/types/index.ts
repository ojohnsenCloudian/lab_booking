import { Role, BookingStatus } from "@prisma/client"

export type { Role, BookingStatus }

export interface BookingWithRelations {
  id: string
  userId: string
  bookingTypeId: string
  labResourceId: string
  startTime: Date
  endTime: Date
  accessCode: string
  status: BookingStatus
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    email: string
  }
  bookingType: {
    id: string
    name: string
  }
  labResource: {
    id: string
    name: string
  }
}


