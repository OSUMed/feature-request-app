import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"
import { type Session } from "next-auth"

const featureRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user) {
      return NextResponse.json({ error: "You must be logged in to submit a feature request" }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = featureRequestSchema.parse(body)

    const featureRequest = await prisma.featureRequest.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        userId: session.user.id,
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

    return NextResponse.json(featureRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create feature request" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const featureRequests = await prisma.featureRequest.findMany({
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
      orderBy: {
        upvotes: {
          _count: "desc",
        },
      },
    })

    return NextResponse.json(featureRequests)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch feature requests" }, { status: 500 })
  }
}

