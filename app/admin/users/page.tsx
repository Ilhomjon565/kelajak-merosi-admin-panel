import { AuthGuard } from "@/components/admin/auth-guard"
import { UsersManagement } from "@/components/admin/users-management"

export default function UsersPage() {
  return (
    <AuthGuard>
      <UsersManagement />
    </AuthGuard>
  )
}
