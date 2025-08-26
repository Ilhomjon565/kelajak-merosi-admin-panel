"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  LogOut,
  Menu,
  X,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  FileText,
  List,
  Clock,
  DollarSign
} from "lucide-react"
import { apiService } from "@/lib/api"
import { AdminSidebar } from "./sidebar"

interface TestTemplate {
  id: string
  title: string
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

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

export function TestTemplatesManagement() {
  const router = useRouter()
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null)
  
  // Fetch data from API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch test templates from the API endpoint
      const response = await fetch('https://api.kelajakmerosi.uz/api/template/all', {
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })
      
      const result = await response.json()
      console.log('Test templates API response:', result)
      
      if (result.success) {
        // API returns test templates directly, not subjects
        const templates: TestTemplate[] = result.data.map((template: any) => ({
          id: template.id.toString(),
          title: template.title,
          duration: template.duration,
          price: template.price,
          subjects: template.subjects || [],
          testSubjectsAndQuestions: template.testSubjectsAndQuestions || []
        }))
        setTestTemplates(templates)
        
        // Extract unique subjects from templates for filtering
        const uniqueSubjects: Subject[] = []
        templates.forEach(template => {
          template.subjects.forEach((subjectData: any) => {
            const existingSubject = uniqueSubjects.find(s => s.id === subjectData.subject.id)
            if (!existingSubject) {
              uniqueSubjects.push(subjectData.subject)
            }
          })
        })
        setSubjects(uniqueSubjects)
      } else {
        setError("Test shablonlarini yuklashda xatolik yuz berdi")
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }



  const filteredTemplates = testTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || !subjectFilter || 
                         template.subjects.some(s => s.subject.id.toString() === subjectFilter)
    
    return matchesSearch && matchesSubject
  })





  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      const response = await fetch(`https://api.kelajakmerosi.uz/api/template/${selectedTemplate.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setTestTemplates(testTemplates.filter(template => template.id !== selectedTemplate.id))
        setIsDeleteDialogOpen(false)
        setSelectedTemplate(null)
      } else {
        console.error('Template o\'chirishda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error deleting template:", err)
    }
  }

  const openDeleteDialog = (template: TestTemplate) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }



  const handleLogout = () => {
    apiService.clearTokens()
    router.push("/admin/login")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
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
        <AdminSidebar currentPage="test-templates" />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Shablonlari</h1>
          <p className="text-gray-600 mt-2">Test shablonlarini boshqarish va tahrirlash</p>
        </div>
        
        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Test Shablonlari</CardTitle>
                <CardDescription>
                  Barcha test shablonlarini ko'rish va boshqarish
                </CardDescription>
              </div>
              
              <div>
                <Button onClick={() => router.push("/admin/test-templates/add")}> 
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi Shablon
                </Button>
              </div>
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
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Fan bo'yicha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha fanlar</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/testTemplate/subject/${template.subjects[0]?.subject.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.title}</CardTitle>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.duration} daqiqa
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {template.price} so'm
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {template.subjects.length} fan
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                         <Button
                       variant="outline"
                       size="sm"
                       className="flex-1"
                       onClick={() => router.push(`/admin/test-templates/edit/${template.id}`)}
                     >
                       <Edit className="mr-2 h-3 w-3" />
                       Tahrirlash
                     </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(template)}
                    >
                      <Trash2 className="h-3 w-3" />
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
                 {searchTerm || subjectFilter 
                   ? "Qidiruv natijalariga mos keladigan shablonlar topilmadi"
                   : "Hali hech qanday test shabloni qo'shilmagan"}
               </p>
             </CardContent>
           </Card>
         )}
      </div>

      

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Test shablonini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedTemplate?.title}" nomli test shablonini o'chirishni xohlaysizmi? 
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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