import { AuthGuard } from "@/components/admin/auth-guard"
import { SettingsManagement } from "@/components/admin/settings-management"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsManagement />
    </AuthGuard>
  )
}
