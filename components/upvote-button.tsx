"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ThumbsUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface UpvoteButtonProps {
  featureId: string
  initialCount: number
}

export function UpvoteButton({ featureId, initialCount }: UpvoteButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [count, setCount] = useState(initialCount)

  const { data: upvoteStatus } = useQuery({
    queryKey: ["upvote", featureId],
    queryFn: async () => {
      if (!session) return { upvoted: false }
      const response = await fetch(`/api/features/${featureId}/upvote`)
      return response.json()
    },
    enabled: !!session,
  })

  const upvoteMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        router.push("/login")
        return
      }
      const response = await fetch(`/api/features/${featureId}/upvote`, {
        method: "POST",
      })
      return response.json()
    },
    onSuccess: (data) => {
      if (data.upvoted) {
        setCount((prev) => prev + 1)
        toast({
          title: "Upvoted!",
          description: "Your vote has been counted.",
        })
      } else {
        setCount((prev) => prev - 1)
        toast({
          title: "Vote removed",
          description: "Your vote has been removed.",
        })
      }
      queryClient.invalidateQueries({ queryKey: ["upvote", featureId] })
      queryClient.invalidateQueries({ queryKey: ["features"] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your vote.",
        variant: "destructive",
      })
    },
  })

  const isUpvoted = upvoteStatus?.upvoted

  return (
    <Button
      variant={isUpvoted ? "default" : "outline"}
      size="sm"
      onClick={() => upvoteMutation.mutate()}
      disabled={upvoteMutation.isPending}
      className="flex gap-2"
    >
      <ThumbsUp size={16} />
      <span>{count}</span>
    </Button>
  )
}

