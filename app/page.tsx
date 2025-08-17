import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to admin login for now
  redirect("/admin/login")
}
