"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100, {
    message: "Title must not exceed 100 characters",
  }),
  description: z.string().min(1, { message: "Description is required" }).max(500, {
    message: "Description must not exceed 500 characters",
  }),
})

export default function SubmitFeaturePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/submit")
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to submit feature request")
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your feature request has been submitted.",
      })
      queryClient.invalidateQueries({ queryKey: ["features"] })
      router.push("/")
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values)
  }

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Submit a Feature Request</CardTitle>
          <CardDescription>Share your ideas for new features or improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a concise title for your feature request" {...field} />
                    </FormControl>
                    <FormDescription>Maximum 100 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your feature request in detail" className="min-h-32" {...field} />
                    </FormControl>
                    <FormDescription>Maximum 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Submit Feature Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

