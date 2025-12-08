import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { TemplatesManagement } from "@/components/admin/templates-management"

export const dynamic = "force-dynamic"

export default async function AdminTemplatesPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connection Templates</h1>
        <p className="text-muted-foreground">
          Manage connection information templates for lab resources
        </p>
      </div>
      <TemplatesManagement />
    </div>
  )
}

