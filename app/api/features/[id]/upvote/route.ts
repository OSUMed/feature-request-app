import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "You must be logged in to upvote" }, { status: 401 })
    }

    // Check if feature exists
    const feature = await prisma.featureRequest.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!feature) {
      return NextResponse.json({ error: "Feature request not found" }, { status: 404 })
    }

    // Check if user already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_featureId: {
          userId: session.user.id,
          featureId: params.id,
        },
      },
    })

    if (existingUpvote) {
      // Remove upvote if it exists
      await prisma.upvote.delete({
        where: {
          id: existingUpvote.id,
        },
      })

      return NextResponse.json({ upvoted: false })
    } else {
      // Create upvote if it doesn't exist
      await prisma.upvote.create({
        data: {
          userId: session.user.id,
          featureId: params.id,
        },
      })

      return NextResponse.json({ upvoted: true })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to process upvote" }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ upvoted: false })
    }

    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_featureId: {
          userId: session.user.id,
          featureId: params.id,
        },
      },
    })

    return NextResponse.json({ upvoted: !!upvote })
  } catch (error) {
    return NextResponse.json({ error: "Failed to check upvote status" }, { status: 500 })
  }
}

