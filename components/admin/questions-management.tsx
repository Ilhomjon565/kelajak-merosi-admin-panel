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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  HelpCircle,
  LogOut,
  Menu,
  X,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Copy
} from "lucide-react"
import { apiService } from "@/lib/api"
import { AdminSidebar } from "./sidebar"

interface Question {
  id: number
  testSubjectId: number
  questionType: string
  writtenAnswer: string
  questionText: string
  imageUrl: string
  youtubeUrl: string
  position: string
  testAnswerOptions: QuestionOption[]
}

interface QuestionOption {
  id: number
  questionId: number
  answerText: string
  imageUrl: string
  isCorrect: boolean
}

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

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
  testSubjectsAndQuestions?: Array<{
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

interface QuestionWithTemplate extends Question {
  templateId: string
  templateTitle: string
}

export function QuestionsManagement() {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [templateFilter, setTemplateFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithTemplate | null>(null)
  
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    subjectId: "",
    testTemplateId: "",
    questionType: "",
    writtenAnswer: "",
    imageUrl: "",
    youtubeUrl: "",
    position: "1",
    testAnswerOptions: [
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false }
    ]
  })

  // Fetch data from API
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch questions
      const questionsResponse = await apiService.getQuestions()
      if (questionsResponse.success) {
        setQuestions(questionsResponse.data || [])
      }
      
      // Fetch subjects
      const subjectsResponse = await apiService.getSubjects()
      if (subjectsResponse.success) {
        setSubjects(subjectsResponse.data || [])
      }
      
      // Fetch test templates using the new API
      const templatesResponse = await apiService.getTestTemplates()
      if (templatesResponse.success) {
        setTestTemplates(templatesResponse.data || [])
      }
    } catch (err) {
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  // Extract all questions from templates for display
  const getAllQuestionsFromTemplates = (): QuestionWithTemplate[] => {
    const allQuestions: QuestionWithTemplate[] = []
    
    testTemplates.forEach(template => {
      template.testSubjectsAndQuestions?.forEach(subject => {
        subject.testQuestions?.forEach(question => {
          allQuestions.push({
            id: Date.now() + Math.random(), // Generate unique ID for display
            testSubjectId: subject.subjectId,
            questionType: question.questionType,
            writtenAnswer: question.writtenAnswer,
            questionText: question.questionText,
            imageUrl: question.imageUrl,
            youtubeUrl: question.youtubeUrl,
            position: question.position,
            testAnswerOptions: question.options?.map((opt, index) => ({
              id: index + 1,
              questionId: 0,
              answerText: opt.answerText,
              imageUrl: opt.imageUrl,
              isCorrect: opt.isCorrect
            })) || [],
            templateId: template.id,
            templateTitle: template.title
          })
        })
      })
    })
    
    return allQuestions
  }

  const allQuestionsFromTemplates = getAllQuestionsFromTemplates()

  const filteredQuestions = allQuestionsFromTemplates.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || !subjectFilter || question.testSubjectId.toString() === subjectFilter
    const matchesType = typeFilter === "all" || !typeFilter || question.questionType === typeFilter
    const matchesTemplate = templateFilter === "all" || !templateFilter || question.templateId.toString() === templateFilter
    
    return matchesSearch && matchesSubject && matchesType && matchesTemplate
  })

  const handleAddQuestion = async () => {
    if (!newQuestion.questionText || !newQuestion.subjectId || !newQuestion.testTemplateId || 
        !newQuestion.questionType) {
      return
    }

    try {
      // First, create or update the test template with the new question
      const selectedTemplate = testTemplates.find(t => t.id.toString() === newQuestion.testTemplateId)
      if (!selectedTemplate) {
        console.error("Selected template not found")
        return
      }

      // Prepare the question data for the template
      const questionData = {
        questionType: newQuestion.questionType,
        questionText: newQuestion.questionText,
        writtenAnswer: newQuestion.writtenAnswer,
        imageUrl: newQuestion.imageUrl,
        youtubeUrl: newQuestion.youtubeUrl,
        position: newQuestion.position,
        options: newQuestion.testAnswerOptions
          .filter(opt => opt.answerText.trim() !== "")
          .map((opt, index) => ({
            answerText: opt.answerText,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect
          }))
      }

      // Prepare template update data
      const templateUpdateData = {
        title: selectedTemplate.title,
        duration: selectedTemplate.duration,
        price: selectedTemplate.price,
        testSubjectsAndQuestions: [{
          subjectId: parseInt(newQuestion.subjectId),
          subjectRole: "MAIN",
          testQuestions: [questionData]
        }]
      }

      // Update the template with the new question
      const response = await apiService.updateTestTemplate(selectedTemplate.id, templateUpdateData)
      if (response.success) {
        await fetchData() // Refresh data
        setNewQuestion({
          questionText: "",
          subjectId: "",
          testTemplateId: "",
          questionType: "",
          writtenAnswer: "",
          imageUrl: "",
          youtubeUrl: "",
          position: "1",
          testAnswerOptions: [
            { answerText: "", imageUrl: "", isCorrect: false },
            { answerText: "", imageUrl: "", isCorrect: false },
            { answerText: "", imageUrl: "", isCorrect: false },
            { answerText: "", imageUrl: "", isCorrect: false }
          ]
        })
        setIsAddDialogOpen(false)
      }
    } catch (err) {
      console.error("Error adding question:", err)
    }
  }

  const handleEditQuestion = async () => {
    if (!selectedQuestion || !newQuestion.questionText || !newQuestion.subjectId || 
        !newQuestion.questionType) {
      return
    }

    try {
      // Find the template that contains this question
      const templateWithQuestion = testTemplates.find(template => 
        template.testSubjectsAndQuestions?.some(subject => 
          subject.testQuestions?.some(q => q.questionText === selectedQuestion.questionText)
        )
      )

      if (!templateWithQuestion) {
        console.error("Template containing question not found")
        return
      }

      // Prepare the updated question data
      const updatedQuestionData = {
        questionType: newQuestion.questionType,
        questionText: newQuestion.questionText,
        writtenAnswer: newQuestion.writtenAnswer,
        imageUrl: newQuestion.imageUrl,
        youtubeUrl: newQuestion.youtubeUrl,
        position: newQuestion.position,
        options: newQuestion.testAnswerOptions
          .filter(opt => opt.answerText.trim() !== "")
          .map((opt, index) => ({
            answerText: opt.answerText,
            imageUrl: opt.imageUrl,
            isCorrect: opt.isCorrect
          }))
      }

      // Update the template with the modified question
      const templateUpdateData = {
        title: templateWithQuestion.title,
        duration: templateWithQuestion.duration,
        price: templateWithQuestion.price,
        testSubjectsAndQuestions: templateWithQuestion.testSubjectsAndQuestions?.map(subject => {
          if (subject.testQuestions?.some(q => q.questionText === selectedQuestion.questionText)) {
            return {
              ...subject,
              testQuestions: subject.testQuestions?.map(q => 
                q.questionText === selectedQuestion.questionText ? updatedQuestionData : q
              ) || []
            }
          }
          return subject
        }) || []
      }

      const response = await apiService.updateTestTemplate(templateWithQuestion.id, templateUpdateData)
      if (response.success) {
        await fetchData() // Refresh data
        setIsEditDialogOpen(false)
        setSelectedQuestion(null)
      }
    } catch (err) {
      console.error("Error updating question:", err)
    }
  }

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return
    
    try {
      // Find the template that contains this question
      const templateWithQuestion = testTemplates.find(template => 
        template.testSubjectsAndQuestions?.some(subject => 
          subject.testQuestions?.some(q => q.questionText === selectedQuestion.questionText)
        )
      )

      if (!templateWithQuestion) {
        console.error("Template containing question not found")
        return
      }

      // Remove the question from the template
      const templateUpdateData = {
        title: templateWithQuestion.title,
        duration: templateWithQuestion.duration,
        price: templateWithQuestion.price,
        testSubjectsAndQuestions: templateWithQuestion.testSubjectsAndQuestions?.map(subject => ({
          ...subject,
          testQuestions: subject.testQuestions?.filter(q => q.questionText !== selectedQuestion.questionText) || []
        })) || []
      }

      const response = await apiService.updateTestTemplate(templateWithQuestion.id, templateUpdateData)
      if (response.success) {
        await fetchData() // Refresh data
        setIsDeleteDialogOpen(false)
        setSelectedQuestion(null)
      }
    } catch (err) {
      console.error("Error deleting question:", err)
    }
  }

  const openEditDialog = (question: QuestionWithTemplate) => {
    setSelectedQuestion(question)
    setNewQuestion({
      questionText: question.questionText,
      subjectId: question.testSubjectId.toString(),
      testTemplateId: question.templateId.toString(),
      questionType: question.questionType,
      writtenAnswer: question.writtenAnswer,
      imageUrl: question.imageUrl,
      youtubeUrl: question.youtubeUrl,
      position: question.position,
      testAnswerOptions: question.testAnswerOptions || [
        { answerText: "", imageUrl: "", isCorrect: false },
        { answerText: "", imageUrl: "", isCorrect: false },
        { answerText: "", imageUrl: "", isCorrect: false },
        { answerText: "", imageUrl: "", isCorrect: false }
      ]
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (question: QuestionWithTemplate) => {
    setSelectedQuestion(question)
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

  const getQuestionTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      "MULTIPLE_CHOICE": "Ko'p tanlovli",
      "SINGLE_CHOICE": "Bitta tanlovli",
      "WRITTEN_ANSWER": "Yozma savol"
    }
    return types[type] || type
  }

  const getDifficultyText = (level: string) => {
    const levels: { [key: string]: string } = {
      "EASY": "Oson",
      "MEDIUM": "O'rtacha",
      "HARD": "Qiyin"
    }
    return levels[level] || level
  }

  const getDifficultyColor = (level: string) => {
    const colors: { [key: string]: string } = {
      "EASY": "bg-green-100 text-green-800",
      "MEDIUM": "bg-yellow-100 text-yellow-800",
      "HARD": "bg-red-100 text-red-800"
    }
    return colors[level] || "bg-gray-100 text-gray-800"
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
        <AdminSidebar currentPage="questions" />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Savollar</h1>
          <p className="text-gray-600 mt-2">Test savollarini boshqarish va tahrirlash</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Savollar</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allQuestionsFromTemplates.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savol Turlari</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(allQuestionsFromTemplates.map(q => q.questionType)).size}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha Variantlar</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(allQuestionsFromTemplates.reduce((acc, q) => acc + q.testAnswerOptions.length, 0) / allQuestionsFromTemplates.length) || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fanlar</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(allQuestionsFromTemplates.map(q => q.templateId)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Savollar</CardTitle>
                <CardDescription>
                  Barcha test savollarini ko'rish va boshqarish
                </CardDescription>
              </div>
              
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Yangi Savol
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Savol matni bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
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
                
                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Shablon bo'yicha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha shablonlar</SelectItem>
                    {testTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tur bo'yicha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha turlar</SelectItem>
                    <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlovli</SelectItem>
                    <SelectItem value="SINGLE_CHOICE">Bitta tanlovli</SelectItem>
                    <SelectItem value="WRITTEN_ANSWER">Yozma savol</SelectItem>
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

        {/* Add Question Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yangi Savol Qo'shish</DialogTitle>
              <DialogDescription>
                Yangi test savolini yarating
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Fan</Label>
                <Select value={newQuestion.subjectId} onValueChange={(value) => setNewQuestion({...newQuestion, subjectId: value})}>
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
                <Label htmlFor="testTemplate">Test Shabloni</Label>
                <Select value={newQuestion.testTemplateId} onValueChange={(value) => setNewQuestion({...newQuestion, testTemplateId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Shablon tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {testTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="questionType">Savol turi</Label>
                <Select value={newQuestion.questionType} onValueChange={(value) => setNewQuestion({...newQuestion, questionType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tur tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlovli</SelectItem>
                    <SelectItem value="SINGLE_CHOICE">Bitta tanlovli</SelectItem>
                    <SelectItem value="WRITTEN_ANSWER">Yozma savol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="questionText">Savol matni</Label>
              <Textarea
                id="questionText"
                value={newQuestion.questionText}
                onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
                placeholder="Savol matnini kiriting..."
                rows={3}
              />
            </div>
            
            {(newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") && (
              <div className="space-y-4">
                <Label>Variantlar</Label>
                {newQuestion.testAnswerOptions.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Variant ${index + 1}`}
                      value={option.answerText}
                      onChange={(e) => {
                        const updatedOptions = [...newQuestion.testAnswerOptions]
                        updatedOptions[index].answerText = e.target.value
                        setNewQuestion({...newQuestion, testAnswerOptions: updatedOptions})
                      }}
                    />
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => {
                        const updatedOptions = newQuestion.testAnswerOptions.map((opt, i) => ({
                          ...opt,
                          isCorrect: i === index
                        }))
                        setNewQuestion({...newQuestion, testAnswerOptions: updatedOptions})
                      }}
                    />
                    <Label className="text-sm">To'g'ri javob</Label>
                  </div>
                ))}
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleAddQuestion}>
                Qo'shish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{question.questionText}</CardTitle>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="outline">
                        {subjects.find(s => s.id === question.testSubjectId)?.name || `Subject ${question.testSubjectId}`}
                      </Badge>
                      <Badge variant="outline">
                        {question.templateTitle}
                      </Badge>
                      <Badge variant="outline">{getQuestionTypeText(question.questionType)}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {question.testAnswerOptions && question.testAnswerOptions.length > 0 && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Variantlar:</Label>
                    <div className="space-y-2">
                      {question.testAnswerOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className={`text-sm ${option.isCorrect ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                            {option.answerText}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>Shablon: {question.templateTitle}</span>
                  <span>Fan: {subjects.find(s => s.id === question.testSubjectId)?.name || `Subject ${question.testSubjectId}`}</span>
                </div>
                
                <Separator />
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(question)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Tahrirlash
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteDialog(question)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 text-lg">
                {searchTerm || subjectFilter || templateFilter || typeFilter || statusFilter 
                  ? "Qidiruv natijalariga mos keladigan savollar topilmadi"
                  : "Hali hech qanday savol qo'shilmagan"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Savolni Tahrirlash</DialogTitle>
            <DialogDescription>
              Savolni tahrirlang
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Fan</Label>
              <Select value={newQuestion.subjectId} onValueChange={(value) => setNewQuestion({...newQuestion, subjectId: value})}>
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
              <Label htmlFor="edit-testTemplate">Test Shabloni</Label>
              <Select value={newQuestion.testTemplateId} onValueChange={(value) => setNewQuestion({...newQuestion, testTemplateId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Shablon tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {testTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-questionType">Savol turi</Label>
              <Select value={newQuestion.questionType} onValueChange={(value) => setNewQuestion({...newQuestion, questionType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tur tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlovli</SelectItem>
                  <SelectItem value="SINGLE_CHOICE">Bitta tanlovli</SelectItem>
                  <SelectItem value="WRITTEN_ANSWER">Yozma savol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-difficultyLevel">Qiyinlik darajasi</Label>
              <Select value="MEDIUM" onValueChange={(value) => console.log(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Daraja tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Oson</SelectItem>
                  <SelectItem value="MEDIUM">O'rtacha</SelectItem>
                  <SelectItem value="HARD">Qiyin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-points">Ball</Label>
              <Input
                id="edit-points"
                type="number"
                // value={newQuestion.points}
                // onChange={(e) => setNewQuestion({...newQuestion, points: e.target.value})}
                placeholder="10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-isActive">Faol</Label>
              <Select value="true" onValueChange={(value) => console.log(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ha</SelectItem>
                  <SelectItem value="false">Yo'q</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-questionText">Savol matni</Label>
            <Textarea
              id="edit-questionText"
              value={newQuestion.questionText}
              onChange={(e) => setNewQuestion({...newQuestion, questionText: e.target.value})}
              placeholder="Savol matnini kiriting..."
              rows={3}
            />
          </div>
          
          {(newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") && (
            <div className="space-y-4">
              <Label>Variantlar</Label>
              {newQuestion.testAnswerOptions.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Variant ${index + 1}`}
                    value={option.answerText}
                    onChange={(e) => {
                      const updatedOptions = [...newQuestion.testAnswerOptions]
                      updatedOptions[index].answerText = e.target.value
                      setNewQuestion({...newQuestion, testAnswerOptions: updatedOptions})
                    }}
                  />
                  <input
                    type="radio"
                    name="editCorrectOption"
                    checked={option.isCorrect}
                    onChange={() => {
                      const updatedOptions = newQuestion.testAnswerOptions.map((opt, i) => ({
                        ...opt,
                        isCorrect: i === index
                      }))
                      setNewQuestion({...newQuestion, testAnswerOptions: updatedOptions})
                    }}
                  />
                  <Label className="text-sm">To'g'ri javob</Label>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleEditQuestion}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Savolni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedQuestion?.questionText.substring(0, 50)}..." nomli savolni o'chirishni xohlaysizmi? 
              Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuestion} className="bg-red-600 hover:bg-red-700">
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
