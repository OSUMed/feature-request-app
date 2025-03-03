"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
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

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Check if user is admin
  if (status === "authenticated" && session.user.role !== "admin") {
    router.push("/")
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/admin")
  }

  const { data: features, isLoading } = useQuery<FeatureRequest[]>({
    queryKey: ["features", "admin"],
    queryFn: async () => {
      const response = await fetch("/api/features")
      if (!response.ok) {
        throw new Error("Failed to fetch feature requests")
      }
      return response.json()
    },
    enabled: status === "authenticated" && session?.user.role === "admin",
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      featureId,
      status,
    }: {
      featureId: string
      status: string
    }) => {
      const response = await fetch(`/api/features/${featureId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update status")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feature status updated successfully.",
      })
      queryClient.invalidateQueries({ queryKey: ["features"] })
      queryClient.invalidateQueries({ queryKey: ["features", "admin"] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    },
  })

  const handleStatusChange = (featureId: string, status: string) => {
    updateStatusMutation.mutate({ featureId, status })
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Feature Requests</CardTitle>
          <CardDescription>Manage feature requests and update their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Submitted by</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Upvotes</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {features?.map((feature) => (
                  <TableRow key={feature.id}>
                    <TableCell className="font-medium">{feature.title}</TableCell>
                    <TableCell>{feature.user.name || feature.user.email}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(feature.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>{feature._count.upvotes}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={feature.status}
                        onValueChange={(value) => handleStatusChange(feature.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

