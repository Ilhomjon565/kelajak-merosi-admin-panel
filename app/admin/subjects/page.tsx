import { AuthGuard } from "@/components/admin/auth-guard"
import { SubjectsManagement } from "@/components/admin/subjects-management"

export default function SubjectsPage() {
  return (
    <AuthGuard>
      <SubjectsManagement />
    </AuthGuard>
  )
}
