import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const updateFeatureSchema = z.object({
  status: z.enum(["pending", "planned", "completed"]),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const featureRequest = await prisma.featureRequest.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            upvotes: true,
          },
        },
      },
    })

    if (!featureRequest) {
      return NextResponse.json({ error: "Feature request not found" }, { status: 404 })
    }

    return NextResponse.json(featureRequest)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feature request" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 })
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Only admins can update feature status" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = updateFeatureSchema.parse(body)

    const featureRequest = await prisma.featureRequest.update({
      where: {
        id: params.id,
      },
      data: {
        status: validatedData.status,
      },
    })

    // Record admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        featureId: params.id,
        action: validatedData.status,
      },
    })

    return NextResponse.json(featureRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update feature request" }, { status: 500 })
  }
}

