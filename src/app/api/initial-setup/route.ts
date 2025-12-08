import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    // Check if admin already exists
    const adminCount = await prisma.user.count({
      where: {
        role: "ADMIN",
      },
    })

    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Admin user already exists" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = setupSchema.parse(body)

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: admin,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating admin user:", error)
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    )
  }
}

