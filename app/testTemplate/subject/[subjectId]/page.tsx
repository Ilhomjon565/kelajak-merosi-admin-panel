"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Eye, 
  Copy,
  LogOut,
  Menu,
  X,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react"
import { apiService } from "@/lib/api"

interface TestTemplate {
  id: number
  duration: number
  price: number
  subjects: Array<{
    subject: {
      id: number
      name: string
      calculator: boolean
      imageUrl: string
    }
    role: string
  }>
}

interface ApiResponse {
  success: boolean
  status: number
  data: TestTemplate[]
  message: string
  errorData: {
    errorCode: string
    errorMessage: string
    details: string
  }
  pageableResponse: {
    total: number
    current: number
    totalPages: number
    perPages: number
  }
}

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

export default function TestTemplateSubjectPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.subjectId as string
  
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>([])
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // Fetch data from API
  useEffect(() => {
    if (subjectId) {
      fetchData()
    }
  }, [subjectId, currentPage, pageSize])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch test templates for specific subject
      const response = await fetch(
        `https://api.bir-zum.uz/api/template/all/${subjectId}?page=${currentPage}&size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('API response error')
      }
      
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setTestTemplates(result.data || [])
        setTotalPages(result.pageableResponse?.totalPages || 0)
        setTotalItems(result.pageableResponse?.total || 0)
        
        // Get subject info from first template if available
        if (result.data && result.data.length > 0 && result.data[0].subjects.length > 0) {
          setSubject(result.data[0].subjects[0].subject)
        }
      } else {
        setError(result.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi')
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = testTemplates.filter(template => {
    const matchesSearch = template.subjects.some(s => 
      s.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return matchesSearch
  })

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleLogout = () => {
    apiService.clearTokens()
    router.push("/admin/login")
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}s ${remainingMinutes}min` : `${hours}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Button onClick={fetchData}>Qayta urinish</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/dashboard")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/subjects")}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Fanlar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start bg-blue-50 text-blue-700"
              onClick={() => router.push("/admin/test-templates")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Test Shablonlari
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start bg-blue-50 text-blue-700"
              onClick={() => router.push("/admin/demo-tests")}
            >
              <Copy className="mr-2 h-4 w-4" />
              Demo testlar
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Foydalanuvchilar
            </Button>
            <Button
              variant="ghost"
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
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/test-templates")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Orqaga
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {subject?.name || 'Fan'} Test Shablonlari
              </h1>
              <p className="text-gray-600 mt-2">
                {subject?.name} faniga tegishli barcha test shablonlari
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Shablonlar</CardTitle>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Joriy Sahifa</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPage} / {totalPages}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sahifa hajmi</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pageSize}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha Vaqt</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {testTemplates.length > 0 
                  ? formatDuration(Math.round(testTemplates.reduce((acc, t) => acc + t.duration, 0) / testTemplates.length))
                  : '0 min'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Test Shablonlari</CardTitle>
                <CardDescription>
                  {subject?.name} faniga tegishli test shablonlarini ko'rish va boshqarish
                </CardDescription>
              </div>
              
              <Button onClick={() => router.push("/admin/test-templates")}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi Shablon
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Shablon nomi bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 ta</SelectItem>
                    <SelectItem value="10">10 ta</SelectItem>
                    <SelectItem value="20">20 ta</SelectItem>
                    <SelectItem value="50">50 ta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {template.subjects[0]?.subject.name || 'Noma\'lum'} Test
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Duration: {formatDuration(template.duration)}, Price: {template.price}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    ID: {template.id}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fan:</span>
                    <span className="font-medium">{template.subjects[0]?.subject.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Vaqt:</span>
                    <span className="font-medium">{formatDuration(template.duration)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Narx:</span>
                    <span className="font-medium">{template.price}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kalkulyator:</span>
                    <span className="font-medium">
                      {template.subjects[0]?.subject.calculator ? 'Ha' : 'Yo\'q'}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/testTemplate/${template.id}`)}
                    >
                      <Eye className="mr-2 h-3 w-3" />
                      Ko'rish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 text-lg">
                {searchTerm 
                  ? "Qidiruv natijalariga mos keladigan shablonlar topilmadi"
                  : "Bu fanga tegishli test shablonlari topilmadi"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} dan {totalItems} ta
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Oldingi
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Keyingi
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}
