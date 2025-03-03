import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { createFeatureRequest, getFeatureRequests } from "./core"
import { type Session } from "next-auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null
  const body = await req.json()
  
  const { status, data } = await createFeatureRequest(session, body)
  return NextResponse.json(data, { status })
}

export async function GET() {
  const { status, data } = await getFeatureRequests()
  return NextResponse.json(data, { status })
}

