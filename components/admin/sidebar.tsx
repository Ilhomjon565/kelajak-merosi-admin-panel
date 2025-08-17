"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LogOut,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Copy,
  FileText
} from "lucide-react"
import { apiService } from "@/lib/api"

interface SidebarProps {
  currentPage?: string
}

export function AdminSidebar({ currentPage = "" }: SidebarProps) {
  const router = useRouter()

  const handleLogout = () => {
    apiService.clearTokens()
    router.push("/admin/login")
  }

  const isCurrentPage = (page: string) => currentPage === page

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant={isCurrentPage("dashboard") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/dashboard")}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
        
        <Button
          variant={isCurrentPage("subjects") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/subjects")}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Fanlar
        </Button>
        
        <Button
          variant={isCurrentPage("test-templates") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/test-templates")}
        >
          <Copy className="mr-2 h-4 w-4" />
          Test Shablonlari
        </Button>

        <Button
          variant={isCurrentPage("demo-tests") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/demo-tests")}
        >
          <FileText className="mr-2 h-4 w-4" />
          Demo Testlar
        </Button>
        
        <Button
          variant={isCurrentPage("users") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/users")}
        >
          <Users className="mr-2 h-4 w-4" />
          Foydalanuvchilar
        </Button>
        
        <Button
          variant={isCurrentPage("settings") ? "default" : "ghost"}
          className="w-full justify-start"
          onClick={() => router.push("/admin/settings")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Sozlamalar
        </Button>
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Chiqish
        </Button>
      </div>
    </div>
  )
}
