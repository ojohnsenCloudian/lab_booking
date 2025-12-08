import { Role, BookingStatus, ConnectionType } from "@prisma/client"

export type { Role, BookingStatus, ConnectionType }

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

export interface ConnectionTemplateFields {
  [key: string]: {
    type: 'string' | 'number' | 'boolean'
    label: string
    required?: boolean
    default?: string | number | boolean
  }
}

