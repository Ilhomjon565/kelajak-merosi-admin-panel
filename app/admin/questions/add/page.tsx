import { AuthGuard } from "@/components/admin/auth-guard"
import { AddQuestionForm } from "@/components/admin/add-question-form"

export default function AddQuestionPage() {
  return (
    <AuthGuard>
      <AddQuestionForm />
    </AuthGuard>
  )
}
