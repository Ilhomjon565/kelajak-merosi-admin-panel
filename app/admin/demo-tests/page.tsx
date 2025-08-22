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
import { Switch } from "@/components/ui/switch"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

interface DemoTest {
  id: number
  title: string
  duration: number
  active: boolean
  calculator: boolean
  imageUrl: string
  questions: Array<{
    id: number
    questionText: string
    imageUrl: string
    youtubeUrl: string
    orderIndex: number
    options: Array<{
      id: number
      answerText: string
      imageUrl: string
      isCorrect: boolean
    }>
  }>
}

interface CreateDemoTestRequest {
  title: string
  duration: number
  active: boolean
  calculator: boolean
  imageUrl: string
  questions: Array<{
    questionText: string
    imageUrl: string
    youtubeUrl: string
    orderIndex: number
    options: Array<{
      answerText: string
      imageUrl: string
      isCorrect: boolean
    }>
  }>
}

interface ApiResponse {
  success: boolean
  status: number
  data: DemoTest[]
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

interface DemoQuestion {
  questionText: string
  imageUrl: string
  youtubeUrl: string
  orderIndex: number
  options: Array<{
    answerText: string
    imageUrl: string
    isCorrect: boolean
  }>
}

export default function DemoTestsPage() {
  const router = useRouter()
  const [demoTests, setDemoTests] = useState<DemoTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<DemoTest | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const [newTest, setNewTest] = useState({
    title: "",
    duration: "",
    active: true,
    calculator: false,
    imageUrl: ""
  })
  
  const [demoQuestions, setDemoQuestions] = useState<DemoQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<DemoQuestion>({
    questionText: "",
    imageUrl: "",
    youtubeUrl: "",
    orderIndex: 1,
    options: [
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false }
    ]
  })

  // Fetch data from API
  useEffect(() => {
    console.log('useEffect triggered - currentPage:', currentPage, 'pageSize:', pageSize)
    fetchData()
  }, [currentPage, pageSize])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `https://api.kelajakmerosi.uz/api/demo/all?page=${currentPage - 1}&size=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          }
        }
      )
      
      console.log('API Response Status:', response.status)
      console.log('API Response OK:', response.ok)
      
      if (!response.ok) {
        throw new Error('API response error')
      }
      
      const result: ApiResponse = await response.json()
      
      console.log('API Result:', result)
      console.log('API Data:', result.data)
      console.log('API Success:', result.success)
      
      if (result.success) {
        setDemoTests(result.data || [])
        setTotalPages(result.pageableResponse?.totalPages || 0)
        setTotalItems(result.pageableResponse?.total || 0)
        console.log('Set Demo Tests:', result.data)
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
        return result.data
      } else {
        throw new Error(result.message || 'Rasm yuklashda xatolik')
      }
    } catch (error) {
      console.error('Rasm yuklashda xatolik:', error)
      throw error
    }
  }

  const filteredTests = demoTests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Debug logging
  console.log('Demo Tests:', demoTests)
  console.log('Filtered Tests:', filteredTests)
  console.log('Search Term:', searchTerm)

  const handleAddTest = async () => {
    if (!newTest.title || !newTest.duration) {
      return
    }

    try {
      setIsUploading(true)
      
      const testData: CreateDemoTestRequest = {
        title: newTest.title,
        duration: parseInt(newTest.duration),
        active: newTest.active,
        calculator: newTest.calculator,
        imageUrl: newTest.imageUrl,
        questions: demoQuestions
      }

      const response = await fetch('https://api.kelajakmerosi.uz/api/demo/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh the list
        setNewTest({
          title: "",
          duration: "",
          active: true,
          calculator: false,
          imageUrl: ""
        })
        setDemoQuestions([])
        setIsAddDialogOpen(false)
      } else {
        console.error('Demo test yaratishda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error adding demo test:", err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditTest = async () => {
    if (!selectedTest || !newTest.title || !newTest.duration) {
      return
    }

    try {
      const testData: CreateDemoTestRequest = {
        title: newTest.title,
        duration: parseInt(newTest.duration),
        active: newTest.active,
        calculator: newTest.calculator,
        imageUrl: newTest.imageUrl,
        questions: demoQuestions
      }

      const response = await fetch(`https://api.kelajakmerosi.uz/api/demo/${selectedTest.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh the list
        setIsEditDialogOpen(false)
        setSelectedTest(null)
      } else {
        console.error('Demo test yangilashda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error updating demo test:", err)
    }
  }

  const handleDeleteTest = async () => {
    if (!selectedTest) return
    
    try {
      const response = await fetch(`https://api.kelajakmerosi.uz/api/demo/${selectedTest.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh the list
        setIsDeleteDialogOpen(false)
        setSelectedTest(null)
      } else {
        console.error('Demo test o\'chirishda xatolik:', result.message)
      }
    } catch (err) {
      console.error("Error deleting demo test:", err)
    }
  }

  const openEditDialog = (test: DemoTest) => {
    setSelectedTest(test)
    setNewTest({
      title: test.title,
      duration: test.duration.toString(),
      active: test.active,
      calculator: test.calculator,
      imageUrl: test.imageUrl
    })
    setDemoQuestions(test.questions || [])
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (test: DemoTest) => {
    setSelectedTest(test)
    setIsDeleteDialogOpen(true)
  }

  const addDemoQuestion = () => {
    if (currentQuestion.questionText.trim() && currentQuestion.options.some(opt => opt.answerText.trim())) {
      setDemoQuestions([...demoQuestions, { ...currentQuestion }])
      setCurrentQuestion({
        questionText: "",
        imageUrl: "",
        youtubeUrl: "",
        orderIndex: demoQuestions.length + 1,
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

  const removeDemoQuestion = (index: number) => {
    setDemoQuestions(demoQuestions.filter((_, i) => i !== index))
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, field: 'answerText' | 'imageUrl' | 'isCorrect', value: string | boolean) => {
    const updatedQuestions = [...demoQuestions]
    if (field === 'isCorrect') {
      updatedQuestions[questionIndex].options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex ? value as boolean : false
      })
    } else {
      updatedQuestions[questionIndex].options[optionIndex][field] = value as string
    }
    setDemoQuestions(updatedQuestions)
  }

  const updateCurrentQuestionOption = (optionIndex: number, field: 'answerText' | 'imageUrl' | 'isCorrect', value: string | boolean) => {
    const updatedQuestion = { ...currentQuestion }
    if (field === 'isCorrect') {
      updatedQuestion.options.forEach((opt, i) => {
        opt.isCorrect = i === optionIndex ? value as boolean : false
      })
    } else {
      updatedQuestion.options[optionIndex][field] = value as string
    }
    setCurrentQuestion(updatedQuestion)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize))
    setCurrentPage(1)
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
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar currentPage="demo-tests" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Demo Testlar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">Admin</Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Demo Testlar</CardTitle>
                  <CardDescription>
                    Barcha demo testlarni ko'rish va boshqarish
                  </CardDescription>
                </div>
                
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                  if (!open) {
                    setDemoQuestions([])
                    setCurrentQuestion({
                      questionText: "",
                      imageUrl: "",
                      youtubeUrl: "",
                      orderIndex: 1,
                      options: [
                        { answerText: "", imageUrl: "", isCorrect: false },
                        { answerText: "", imageUrl: "", isCorrect: false },
                        { answerText: "", imageUrl: "", isCorrect: false },
                        { answerText: "", imageUrl: "", isCorrect: false }
                      ]
                    })
                  }
                  setIsAddDialogOpen(open)
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Yangi Demo Test
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Yangi Demo Test Qo'shish</DialogTitle>
                      <DialogDescription>
                        Yangi demo test yarating
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Yo'nalish nomi</Label>
                        <Input
                          id="title"
                          value={newTest.title}
                          onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                          placeholder="Test yo'nalishi nomi"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration">Vaqt (minut)</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={newTest.duration}
                          onChange={(e) => setNewTest({...newTest, duration: e.target.value})}
                          placeholder="60"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">Rasm URL</Label>
                        <Input
                          id="imageUrl"
                          value={newTest.imageUrl}
                          onChange={(e) => setNewTest({...newTest, imageUrl: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="imageFile">Rasm fayli</Label>
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const imageUrl = await handleImageUpload(file)
                                setNewTest(prev => ({ ...prev, imageUrl }))
                              } catch (error) {
                                console.error('Rasm yuklashda xatolik:', error)
                              }
                            }
                          }}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={newTest.active}
                          onCheckedChange={(checked) => setNewTest({...newTest, active: checked})}
                        />
                        <Label htmlFor="active">Faol</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="calculator"
                          checked={newTest.calculator}
                          onCheckedChange={(checked) => setNewTest({...newTest, calculator: checked})}
                        />
                        <Label htmlFor="calculator">Kalkulyator</Label>
                      </div>
                    </div>

                    {/* Demo Questions Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Test Savollari</Label>
                      </div>

                      {demoQuestions.length > 0 && (
                        <div className="space-y-3">
                          {demoQuestions.map((question, qIndex) => (
                            <Card key={qIndex} className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm">Savol {qIndex + 1}</h4>
                                    <Badge variant="outline" className="text-xs">P: {question.orderIndex}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{question.questionText}</p>
                                  {question.imageUrl && (
                                    <div className="mb-2">
                                      <img 
                                        src={question.imageUrl} 
                                        alt="Savol rasmi" 
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeDemoQuestion(qIndex)}
                                  className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="space-y-1">
                                <h5 className="text-xs font-medium text-gray-700">Variantlar:</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2 text-xs">
                                      <input
                                        type="radio"
                                        name={`question-${qIndex}`}
                                        checked={option.isCorrect}
                                        onChange={() => updateQuestionOption(qIndex, oIndex, 'isCorrect', true)}
                                        className="text-blue-600"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <span className={`truncate block ${option.isCorrect ? 'font-medium text-green-600' : ''}`}>
                                          {option.answerText}
                                        </span>
                                        {option.imageUrl && (
                                          <img 
                                            src={option.imageUrl} 
                                            alt="Variant rasmi" 
                                            className="w-8 h-8 object-cover rounded mt-1"
                                          />
                                        )}
                                      </div>
                                      {option.isCorrect && <Badge variant="secondary" className="text-xs flex-shrink-0">✓</Badge>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}

                      {demoQuestions.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">Hali hech qanday savol qo'shilgan</p>
                          <p className="text-sm text-gray-400 mt-1">Demo test yaratish uchun savollar qo'shing</p>
                        </div>
                      )}
                    </div>

                    {/* Add Question Button - Always at bottom */}
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsAddQuestionDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Savol Qo'shish
                      </Button>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Bekor qilish
                      </Button>
                      <Button 
                        onClick={handleAddTest}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Yuklanmoqda...
                          </>
                        ) : (
                          'Qo\'shish'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Test nomi bo'yicha qidirish..."
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

          {/* Tests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredTests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Duration: {test.duration} min
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {test.active && <Badge variant="default" className="text-xs">Faol</Badge>}
                      {test.calculator && <Badge variant="secondary" className="text-xs">Kalkulyator</Badge>}
                    </div>
                  </div>
                </CardHeader>
                
                {test.imageUrl && (
                  <div className="px-6 pb-2">
                    <img 
                      src={test.imageUrl} 
                      alt={test.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vaqt:</span>
                      <span className="font-medium">{test.duration} min</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Savollar:</span>
                      <span className="font-medium">{test.questions?.length || 0} ta</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Holat:</span>
                      <span className="font-medium">
                        {test.active ? 'Faol' : 'Faol emas'}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(test)}
                      >
                        <Edit className="mr-2 h-3 w-3" />
                        Tahrirlash
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(test)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTests.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500 text-lg">
                  {searchTerm 
                    ? "Qidiruv natijalariga mos keladigan testlar topilmadi"
                    : "Hali hech qanday demo test qo'shilgan"}
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
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Demo Testni Tahrirlash</DialogTitle>
            <DialogDescription>
              Demo testni tahrirlang
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Yo'nalish nomi</Label>
              <Input
                id="edit-title"
                value={newTest.title}
                onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                placeholder="Test yo'nalishi nomi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Vaqt (minut)</Label>
              <Input
                id="edit-duration"
                type="number"
                value={newTest.duration}
                onChange={(e) => setNewTest({...newTest, duration: e.target.value})}
                placeholder="60"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Rasm URL</Label>
              <Input
                id="edit-imageUrl"
                value={newTest.imageUrl}
                onChange={(e) => setNewTest({...newTest, imageUrl: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={newTest.active}
                onCheckedChange={(checked) => setNewTest({...newTest, active: checked})}
              />
              <Label htmlFor="edit-active">Faol</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-calculator"
                checked={newTest.calculator}
                onCheckedChange={(checked) => setNewTest({...newTest, calculator: checked})}
              />
              <Label htmlFor="edit-calculator">Kalkulyator</Label>
            </div>
          </div>

          {/* Demo Questions Section for Edit */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Test Savollari</Label>
            </div>

            {demoQuestions.length > 0 && (
              <div className="space-y-3">
                {demoQuestions.map((question, qIndex) => (
                  <Card key={qIndex} className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">Savol {qIndex + 1}</h4>
                          <Badge variant="outline" className="text-xs">P: {question.orderIndex}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{question.questionText}</p>
                        {question.imageUrl && (
                          <div className="mb-2">
                            <img 
                              src={question.imageUrl} 
                              alt="Savol rasmi" 
                              className="w-16 h-16 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeDemoQuestion(qIndex)}
                        className="text-red-600 hover:text-red-700 ml-2 flex-shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-1">
                      <h5 className="text-xs font-medium text-gray-700">Variantlar:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2 text-xs">
                            <input
                              type="radio"
                              name={`edit-question-${qIndex}`}
                              checked={option.isCorrect}
                              onChange={() => updateQuestionOption(qIndex, oIndex, 'isCorrect', true)}
                              className="text-blue-600"
                            />
                            <div className="flex-1 min-w-0">
                              <span className={`truncate block ${option.isCorrect ? 'font-medium text-green-600' : ''}`}>
                                {option.answerText}
                              </span>
                              {option.imageUrl && (
                                <img 
                                  src={option.imageUrl} 
                                  alt="Variant rasmi" 
                                  className="w-8 h-8 object-cover rounded mt-1"
                                />
                              )}
                            </div>
                            {option.isCorrect && <Badge variant="secondary" className="text-xs flex-shrink-0">✓</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {demoQuestions.length === 0 && (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Hali hech qanday savol qo'shilgan</p>
                <p className="text-sm text-gray-400 mt-1">Demo test yaratish uchun savollar qo'shing</p>
              </div>
            )}
          </div>

          {/* Add Question Button for Edit */}
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsAddQuestionDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Savol Qo'shish
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEditTest}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Demo testni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedTest?.title}" nomli demo testni o'chirishni xohlaysizmi? 
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTest} className="bg-red-600 hover:bg-red-700">
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
              Demo testga yangi savol qo'shing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderIndex">Pozitsiya</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={currentQuestion.orderIndex}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, orderIndex: parseInt(e.target.value) || 1})}
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
                  Bitta to'g'ri javob tanlang
                </span>
              </div>
              
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => updateCurrentQuestionOption(index, 'isCorrect', !option.isCorrect)}
                      className="text-blue-600 flex-shrink-0"
                    />
                    
                    <div className="flex-1 space-y-1">
                      <Input
                        placeholder={`Variant ${String.fromCharCode(65 + index)} matni`}
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
            <Button onClick={addDemoQuestion}>
              Savolni Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}