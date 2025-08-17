import { AuthGuard } from "@/components/admin/auth-guard"
import { TestTemplatesManagement } from "@/components/admin/test-templates-management"

export default function TestTemplatesPage() {
  return (
    <AuthGuard>
      <TestTemplatesManagement />
    </AuthGuard>
  )
}
