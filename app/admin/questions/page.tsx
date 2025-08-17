import { AuthGuard } from "@/components/admin/auth-guard"
import { QuestionsManagement } from "@/components/admin/questions-management"

export default function QuestionsPage() {
  return (
    <AuthGuard>
      <QuestionsManagement />
    </AuthGuard>
  )
}
