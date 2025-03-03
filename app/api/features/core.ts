import { z } from "zod"
import prisma from "@/lib/prisma"
import { type Session } from "next-auth"

export const featureRequestSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
})

export type FeatureRequestInput = z.infer<typeof featureRequestSchema>

export async function createFeatureRequest(session: Session | null, input: unknown) {
  if (!session?.user) {
    return { 
      status: 401, 
      data: { error: "You must be logged in to submit a feature request" } 
    }
  }

  try {
    const validatedData = featureRequestSchema.parse(input)
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
            email: true 
          } 
        },
        _count: { 
          select: { 
            upvotes: true 
          } 
        },
      },
    })

    return { status: 201, data: featureRequest }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 400, data: { error: error.errors } }
    }
    return { status: 500, data: { error: "Failed to create feature request" } }
  }
}

export async function getFeatureRequests() {
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

    return { status: 200, data: featureRequests }
  } catch (error) {
    return { status: 500, data: { error: "Failed to fetch feature requests" } }
  }
} 