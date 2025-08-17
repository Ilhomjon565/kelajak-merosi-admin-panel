import { AuthGuard } from "@/components/admin/auth-guard"
import { AdminDashboard } from "@/components/admin/dashboard"

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  )
}
