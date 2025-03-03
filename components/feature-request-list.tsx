"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpvoteButton } from "@/components/upvote-button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"

type FeatureRequest = {
  id: string
  title: string
  description: string
  status: "pending" | "planned" | "completed"
  createdAt: string
  user: {
    name: string | null
    email: string | null
  }
  _count: {
    upvotes: number
  }
}

export function FeatureRequestList() {
  const {
    data: features,
    isLoading,
    error,
  } = useQuery<FeatureRequest[]>({
    queryKey: ["features"],
    queryFn: async () => {
      const response = await fetch("/api/features")
      if (!response.ok) {
        throw new Error("Failed to fetch feature requests")
      }
      return response.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">Error loading feature requests</div>
  }

  if (!features?.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p>No feature requests yet. Be the first to submit one!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <Card key={feature.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <StatusBadge status={feature.status} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{feature.description}</p>
            <div className="mt-4 text-sm text-muted-foreground">
              Submitted by {feature.user.name || feature.user.email}{" "}
              {formatDistanceToNow(new Date(feature.createdAt), { addSuffix: true })}
            </div>
          </CardContent>
          <CardFooter>
            <UpvoteButton featureId={feature.id} initialCount={feature._count.upvotes} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "planned":
      return <Badge variant="secondary">Planned</Badge>
    case "completed":
      return <Badge variant="default">Completed</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

