import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ResourcesManagement } from "@/components/admin/resources-management"

export const dynamic = "force-dynamic"

export default async function AdminResourcesPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Resources</h1>
        <p className="text-muted-foreground">Create and manage lab resources</p>
      </div>
      <ResourcesManagement />
    </div>
  )
}

