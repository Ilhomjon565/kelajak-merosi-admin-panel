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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  BarChart3
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
  questions?: Array<{
    id: number
    testSubjectId: number
    questionType: string
    writtenAnswer: string
    questionText: string
    imageUrl: string
    youtubeUrl: string
    position: string
    options: Array<{
      id: number
      questionId: number
      answerText: string
      imageUrl: string
      isCorrect: boolean
    }>
  }>
}

interface CreateTestTemplateRequest {
  title: string
  duration: number
  price: number
  testSubjectsAndQuestions: Array<{
    subjectId: number
    subjectRole: string
    testQuestions: Array<{
      questionType: string
      questionText: string
      writtenAnswer: string
      imageUrl: string
      youtubeUrl: string
      position: string
      options: Array<{
        answerText: string
        imageUrl: string
        isCorrect: boolean
      }>
    }>
  }>
}

interface TestQuestion {
  questionType: string
  questionText: string
  writtenAnswer: string
  imageUrl: string
  youtubeUrl: string
  position: string
  options: Array<{
    answerText: string
    imageUrl: string
    isCorrect: boolean
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
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TestTemplate | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
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
          subjects: template.subjects || []
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
  
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    subjectId: "",
    duration: "",
    price: "0",
    imageUrl: ""
  })
  
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([])
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion>({
    questionType: "SINGLE_CHOICE",
    questionText: "",
    writtenAnswer: "",
    imageUrl: "",
    youtubeUrl: "",
    position: "",
    options: [
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false }
    ]
  })

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('https://api.kelajakmerosi.uz/api/template/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // API response: { "success": true, "status": 200, "data": "https://..." }
        // data field directly contains the image URL
        return result.data
      } else {
        throw new Error(result.message || 'Rasm yuklashda xatolik')
      }
    } catch (error) {
      console.error('Rasm yuklashda xatolik:', error)
      throw error
    }
  }

  const filteredTemplates = testTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || !subjectFilter || 
                         template.subjects.some(s => s.subject.id.toString() === subjectFilter)
    
    return matchesSearch && matchesSubject
  })

  const handleAddTemplate = async () => {
    if (!newTemplate.title || !newTemplate.subjectId || !newTemplate.duration) {
      return
    }

    try {
      setIsUploading(true)
      
      // Agar rasm tanlangan bo'lsa, uni yuklash
      let imageUrl = ""
      if (selectedImage) {
        try {
          imageUrl = await handleImageUpload(selectedImage)
        } catch (error) {
          console.error('Rasm yuklashda xatolik:', error)
          // Rasm yuklanmasa ham template yaratish davom etadi
        }
      }

      // API strukturasiga mos ravishda ma'lumotlarni tayyorlash
      const templateData: CreateTestTemplateRequest = {
        title: newTemplate.title,
        duration: parseInt(newTemplate.duration),
        price: parseInt(newTemplate.price),
        testSubjectsAndQuestions: [{
          subjectId: parseInt(newTemplate.subjectId),
          subjectRole: 'MAIN',
          testQuestions: testQuestions // Test savollarini qo'shamiz
        }]
      }

      // API ga so'rov yuborish
      const response = await fetch('https://api.kelajakmerosi.uz/api/template/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify(templateData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Yangi template ni local state ga qo'shish
        const newTemplateFromAPI: TestTemplate = {
          id: result.data.id.toString(),
          title: newTemplate.title,
          duration: parseInt(newTemplate.duration),
          price: parseInt(newTemplate.price),
          subjects: [{
            subject: {
              id: parseInt(newTemplate.subjectId),
              name: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.name || '',
              calculator: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.calculator || false,
              imageUrl: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.imageUrl || ''
            },
            role: 'MAIN'
          }]
        }
        
        setTestTemplates([...testTemplates, newTemplateFromAPI])
        setNewTemplate({
          title: "",
          subjectId: "",
          duration: "",
          price: "0",
          imageUrl: ""
        })
        setSelectedImage(null)
        setTestQuestions([])
        setIsAddDialogOpen(false)
      } else {
        console.error('Template yaratishda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error adding template:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !newTemplate.title || !newTemplate.subjectId || !newTemplate.duration) {
      return
    }

    try {
      // API strukturasiga mos ravishda ma'lumotlarni tayyorlash
      const templateData: CreateTestTemplateRequest = {
        title: newTemplate.title,
        duration: parseInt(newTemplate.duration),
        price: parseInt(newTemplate.price),
        testSubjectsAndQuestions: [{
          subjectId: parseInt(newTemplate.subjectId),
          subjectRole: 'MAIN',
          testQuestions: testQuestions // Test savollarini qo'shamiz
        }]
      }

      // API ga so'rov yuborish
      const response = await fetch(`https://api.kelajakmerosi.uz/api/template/update/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify(templateData)
      })

      const result = await response.json()
      
      if (result.success) {
        // Local state ni yangilash
        setTestTemplates(testTemplates.map(template =>
          template.id === selectedTemplate.id ? {
            ...template,
            title: newTemplate.title,
            duration: parseInt(newTemplate.duration),
            price: parseInt(newTemplate.price),
            subjects: [{
              subject: {
                id: parseInt(newTemplate.subjectId),
                name: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.name || '',
                calculator: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.calculator || false,
                imageUrl: subjects.find(s => s.id === parseInt(newTemplate.subjectId))?.imageUrl || ''
              },
              role: 'MAIN'
            }]
          } : template
        ))
        
        setIsEditDialogOpen(false)
        setSelectedTemplate(null)
      } else {
        console.error('Template yangilashda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error updating template:", err)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return
    
    try {
      // API ga so'rov yuborish
      const response = await fetch(`https://api.kelajakmerosi.uz/api/template/${selectedTemplate.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        // Local state dan o'chirish
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

  const openEditDialog = (template: TestTemplate) => {
    setSelectedTemplate(template)
    setNewTemplate({
      title: template.title,
      subjectId: template.subjects[0]?.subject.id.toString() || '',
      duration: template.duration.toString(),
      price: template.price.toString(),
      imageUrl: ""
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (template: TestTemplate) => {
    setSelectedTemplate(template)
    setIsDeleteDialogOpen(true)
  }

  const addTestQuestion = () => {
    if (currentQuestion.questionText.trim() && currentQuestion.options.some(opt => opt.answerText.trim())) {
      setTestQuestions([...testQuestions, { ...currentQuestion }])
      setCurrentQuestion({
        questionType: "SINGLE_CHOICE",
        questionText: "",
        writtenAnswer: "",
        imageUrl: "",
        youtubeUrl: "",
        position: "",
        options: [
          { answerText: "", imageUrl: "", isCorrect: false },
          { answerText: "", imageUrl: "", isCorrect: false },
          { answerText: "", imageUrl: "", isCorrect: false },
          { answerText: "", imageUrl: "", isCorrect: false }
        ]
      })
      setIsAddQuestionDialogOpen(false)
    }
  }

  const removeTestQuestion = (index: number) => {
    setTestQuestions(testQuestions.filter((_, i) => i !== index))
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, field: 'answerText' | 'imageUrl' | 'isCorrect', value: string | boolean) => {
    const updatedQuestions = [...testQuestions]
    if (field === 'isCorrect') {
      // Only one option can be correct for single choice
      updatedQuestions[questionIndex].options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex ? value as boolean : false
      })
    } else {
      updatedQuestions[questionIndex].options[optionIndex][field] = value as string
    }
    setTestQuestions(updatedQuestions)
  }

  const updateCurrentQuestionOption = (optionIndex: number, field: 'answerText' | 'imageUrl' | 'isCorrect', value: string | boolean) => {
    const updatedQuestion = { ...currentQuestion }
    if (field === 'isCorrect') {
      // Only one option can be correct for single choice
      updatedQuestion.options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex ? value as boolean : false
      })
    } else {
      updatedQuestion.options[optionIndex][field] = value as string
    }
    setCurrentQuestion(updatedQuestion)
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Shablonlar</CardTitle>
              <Copy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testTemplates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha Vaqt</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(testTemplates.reduce((acc, t) => acc + t.duration, 0) / testTemplates.length) || 0} min
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
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Holat bo'yicha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha holatlar</SelectItem>
                    <SelectItem value="active">Faol</SelectItem>
                    <SelectItem value="inactive">Faol emas</SelectItem>
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
                      onClick={() => openEditDialog(template)}
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
                {searchTerm || subjectFilter || statusFilter 
                  ? "Qidiruv natijalariga mos keladigan shablonlar topilmadi"
                  : "Hali hech qanday test shabloni qo'shilmagan"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Shablonini Tahrirlash</DialogTitle>
            <DialogDescription>
              Test shablonini tahrirlang
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Nomi</Label>
              <Input
                id="edit-title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                placeholder="Test nomi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Fan</Label>
              <Select value={newTemplate.subjectId} onValueChange={(value) => setNewTemplate({...newTemplate, subjectId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Fan tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Vaqt chegarasi (minut)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={newTemplate.duration}
                onChange={(e) => setNewTemplate({...newTemplate, duration: e.target.value})}
                placeholder="60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-price">Narx</Label>
              <Input
                id="edit-price"
                type="number"
                value={newTemplate.price}
                onChange={(e) => setNewTemplate({...newTemplate, price: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>
          

          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEditTemplate}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi Test Savolini Qo'shish</DialogTitle>
            <DialogDescription>
              Test shabloniga yangi savol qo'shing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Question Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionType">Savol turi</Label>
                <Select 
                  value={currentQuestion.questionType} 
                  onValueChange={(value) => setCurrentQuestion({...currentQuestion, questionType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE_CHOICE">Bitta tanlash</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlash</SelectItem>
                    <SelectItem value="WRITTEN">Yozma javob</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Pozitsiya</Label>
                <Input
                  id="position"
                  value={currentQuestion.position}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, position: e.target.value})}
                  placeholder="1, 2, 3..."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questionText">Savol matni</Label>
              <Textarea
                id="questionText"
                value={currentQuestion.questionText}
                onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                placeholder="Savol matnini kiriting..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="writtenAnswer">Yozma javob (ixtiyoriy)</Label>
              <Textarea
                id="writtenAnswer"
                value={currentQuestion.writtenAnswer}
                onChange={(e) => setCurrentQuestion({...currentQuestion, writtenAnswer: e.target.value})}
                placeholder="Yozma javob uchun..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="questionImageFile">Savol rasm fayli</Label>
                <Input
                  id="questionImageFile"
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      try {
                        const imageUrl = await handleImageUpload(file)
                        setCurrentQuestion({...currentQuestion, imageUrl})
                      } catch (error) {
                        console.error('Savol rasm yuklashda xatolik:', error)
                      }
                    }
                  }}
                  className="cursor-pointer"
                />
                {currentQuestion.imageUrl && (
                  <p className="text-xs text-green-600 mt-1">
                    Rasm yuklandi: {currentQuestion.imageUrl}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube URL (ixtiyoriy)</Label>
                <Input
                  id="youtubeUrl"
                  value={currentQuestion.youtubeUrl}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, youtubeUrl: e.target.value})}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
            
            {/* Options Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Javob variantlari</Label>
                <span className="text-sm text-gray-500">
                  {currentQuestion.questionType === 'SINGLE_CHOICE' ? 'Bitta to\'g\'ri javob tanlang' : 'Ko\'p to\'g\'ri javob tanlash mumkin'}
                </span>
              </div>
              
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                    <input
                      type={currentQuestion.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => updateCurrentQuestionOption(index, 'isCorrect', !option.isCorrect)}
                      className="text-blue-600 flex-shrink-0"
                    />
                    
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder={`Variant ${index + 1} matni`}
                        value={option.answerText}
                        onChange={(e) => updateCurrentQuestionOption(index, 'answerText', e.target.value)}
                        className="text-sm"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            try {
                              const imageUrl = await handleImageUpload(file)
                              updateCurrentQuestionOption(index, 'imageUrl', imageUrl)
                            } catch (error) {
                              console.error('Variant rasm yuklashda xatolik:', error)
                            }
                          }
                        }}
                        className="text-sm cursor-pointer"
                        placeholder="Rasm fayli"
                      />
                      {option.imageUrl && (
                        <p className="text-xs text-green-600">
                          Rasm yuklandi: {option.imageUrl}
                        </p>
                      )}
                    </div>
                    
                    <Badge variant={option.isCorrect ? "default" : "secondary"} className="text-xs flex-shrink-0">
                      {option.isCorrect ? '✓' : '✗'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuestionDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={addTestQuestion}>
              Savolni Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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