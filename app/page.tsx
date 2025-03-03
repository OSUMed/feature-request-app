import { FeatureRequestList } from "@/components/feature-request-list"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Feature Requests</h1>
        <Link href="/submit" className={buttonVariants()}>
          Submit Request
        </Link>
      </div>
      <FeatureRequestList />
    </div>
  )
}

