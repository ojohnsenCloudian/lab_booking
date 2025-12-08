import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { UsersManagement } from "@/components/admin/users-management"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">Create and manage user accounts</p>
      </div>
      <UsersManagement />
    </div>
  )
}

