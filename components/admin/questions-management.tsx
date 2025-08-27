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
  options: QuestionOption[]
}

interface QuestionOption {
  id?: number
  questionId?: number
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

  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionWithTemplate | null>(null)
  
     const [newQuestion, setNewQuestion] = useState<{
       questionText: string
       subjectId: string
       testTemplateId: string
       questionType: string
       writtenAnswer: string
       imageUrl: string
       youtubeUrl: string
       position: string
       options: QuestionOption[]
     }>({
       questionText: "",
       subjectId: "",
       testTemplateId: "",
       questionType: "",
       writtenAnswer: "",
       imageUrl: "",
       youtubeUrl: "",
       position: "1",
       options: []
     })

     // Function to ensure we always have the correct number of options
   const ensureCorrectOptionsCount = (options: any[], count: number = 4) => {
     const currentOptions = [...options]
     while (currentOptions.length < count) {
       currentOptions.push({ answerText: "", imageUrl: "", isCorrect: false })
     }
     return currentOptions.slice(0, count)
   }

   // Function to add a new option
   const addNewOption = () => {
     setNewQuestion(prev => ({
       ...prev,
       options: [...prev.options, { answerText: "", imageUrl: "", isCorrect: false }]
     }))
   }

  // Function to remove an option
  const removeOption = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  // Function to validate options
  const validateOptions = () => {
    if (newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") {
      const filledOptions = newQuestion.options.filter(opt => opt.answerText.trim() !== "")
      if (filledOptions.length < 2) {
        return false
      }
      // Check if at least one option is marked as correct
      if (!newQuestion.options.some(opt => opt.isCorrect)) {
        return false
      }
    }
    // For WRITTEN_ANSWER questions, no options validation needed
    return true
  }

  // Function to get validation errors
  const getValidationErrors = () => {
    const errors: string[] = []
    
    if (newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") {
      const filledOptions = newQuestion.options.filter(opt => opt.answerText.trim() !== "")
      if (filledOptions.length < 2) {
        errors.push("Kamida 2 ta variant to'ldirilishi kerak")
      }
      if (!newQuestion.options.some(opt => opt.isCorrect)) {
        errors.push("Kamida 1 ta to'g'ri javob tanlanishi kerak")
      }
    }
    
    // For WRITTEN_ANSWER questions, no options validation needed
    return errors
  }

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

  // Get all questions and sort them by position
  const getAllQuestions = (): Question[] => {
    // Sort questions by position in ascending order
    return questions.sort((a, b) => {
      const positionA = parseInt(a.position) || 0
      const positionB = parseInt(b.position) || 0
      return positionA - positionB
    })
  }

  const allQuestions = getAllQuestions()

  const filteredQuestions = allQuestions.filter(question => {
    const matchesSearch = question.questionText.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = subjectFilter === "all" || !subjectFilter || question.testSubjectId.toString() === subjectFilter
    const matchesType = typeFilter === "all" || !typeFilter || question.questionType === typeFilter
    
    return matchesSearch && matchesSubject && matchesType
  })

  const handleAddQuestion = async () => {
    if (!newQuestion.questionText || !newQuestion.subjectId || !newQuestion.questionType || !newQuestion.position) {
      return
    }

    // Validate options for choice questions
    if (!validateOptions()) {
      return
    }

    try {
                    // Prepare the question data
        const questionData = {
          testSubjectId: parseInt(newQuestion.subjectId),
          questionType: newQuestion.questionType,
          questionText: newQuestion.questionText,
          writtenAnswer: newQuestion.writtenAnswer,
          imageUrl: newQuestion.imageUrl,
          youtubeUrl: newQuestion.youtubeUrl,
          position: newQuestion.position,
          options: newQuestion.questionType === "WRITTEN_ANSWER" 
            ? [] 
            : newQuestion.options
                .filter(opt => opt.answerText.trim() !== "")
                .map((opt, index) => ({
                  answerText: opt.answerText,
                  imageUrl: opt.imageUrl,
                  isCorrect: opt.isCorrect
                }))
        }

             // Log the data being sent
       console.log("Creating question with data:", JSON.stringify(questionData, null, 2))
       
       // Create the question using the API
       const response = await apiService.createQuestion(questionData)
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
           options: []
         })
        setIsAddDialogOpen(false)
      }
    } catch (err) {
      console.error("Error adding question:", err)
    }
  }

  const handleEditQuestion = async () => {
    if (!selectedQuestion || !newQuestion.questionText || !newQuestion.subjectId || 
        !newQuestion.questionType || !newQuestion.position) {
      return
    }

    // Validate options for choice questions
    if (!validateOptions()) {
      return
    }

    try {
             // Prepare the updated question data
       const updatedQuestionData = {
         testSubjectId: parseInt(newQuestion.subjectId),
         questionType: newQuestion.questionType,
         questionText: newQuestion.questionText,
         writtenAnswer: newQuestion.writtenAnswer,
         imageUrl: newQuestion.imageUrl,
         youtubeUrl: newQuestion.youtubeUrl,
         position: newQuestion.position,
         options: newQuestion.questionType === "WRITTEN_ANSWER" 
           ? [] 
           : newQuestion.options
               .filter(opt => opt.answerText.trim() !== "")
               .map((opt, index) => ({
                 answerText: opt.answerText,
                 imageUrl: opt.imageUrl,
                 isCorrect: opt.isCorrect
               }))
       }

             // Log the data being sent
       console.log("Updating question with data:", JSON.stringify(updatedQuestionData, null, 2))
       
       // Update the question using the API
       const response = await apiService.updateQuestion(selectedQuestion.id, updatedQuestionData)
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
      // Delete the question using the API
      const response = await apiService.deleteQuestion(selectedQuestion.id)
      if (response.success) {
        await fetchData() // Refresh data
        setIsDeleteDialogOpen(false)
        setSelectedQuestion(null)
      }
    } catch (err) {
      console.error("Error deleting question:", err)
    }
  }

  const openEditDialog = (question: Question) => {
    setSelectedQuestion({
      ...question,
      templateId: "",
      templateTitle: ""
    })
    setNewQuestion({
      questionText: question.questionText,
      subjectId: question.testSubjectId.toString(),
      testTemplateId: "",
      questionType: question.questionType,
      writtenAnswer: question.writtenAnswer,
      imageUrl: question.imageUrl,
      youtubeUrl: question.youtubeUrl,
      position: question.position,
      options: question.options && question.options.length > 0 
        ? question.options 
        : []
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (question: Question) => {
    setSelectedQuestion({
      ...question,
      templateId: "",
      templateTitle: ""
    })
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
              <div className="text-2xl font-bold">{allQuestions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savol Turlari</CardTitle>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                                 {new Set(allQuestions.map(q => q.questionType)).size}
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
                                  {Math.round(allQuestions.reduce((acc, q) => acc + q.options.length, 0) / allQuestions.length) || 0}
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
                                 {new Set(allQuestions.map(q => q.testSubjectId)).size}
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
                 <Label htmlFor="questionType">Savol turi</Label>
                 <Select value={newQuestion.questionType} onValueChange={(value) => {
                                  if (value === "MULTIPLE_CHOICE" || value === "SINGLE_CHOICE") {
                   // For choice questions, clear written answer and set default options
                   setNewQuestion(prev => ({
                     ...prev,
                     questionType: value,
                     writtenAnswer: "",
                     options: [
                       { answerText: "", imageUrl: "", isCorrect: false },
                       { answerText: "", imageUrl: "", isCorrect: false }
                     ]
                   }))
                 } else if (value === "WRITTEN_ANSWER") {
                   // For written answer questions, clear options
                   setNewQuestion(prev => ({
                     ...prev,
                     questionType: value,
                     options: []
                   }))
                 }
                 }}>
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
                <Label htmlFor="position">Pozitsiya</Label>
                <Input
                  id="position"
                  type="number"
                  value={newQuestion.position}
                  onChange={(e) => setNewQuestion({...newQuestion, position: e.target.value})}
                  placeholder="Savol pozitsiyasini kiriting..."
                />
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
            
            <div className="space-y-2">
              <Label htmlFor="writtenAnswer">Yozma javob</Label>
              <Textarea
                id="writtenAnswer"
                value={newQuestion.writtenAnswer}
                onChange={(e) => setNewQuestion({...newQuestion, writtenAnswer: e.target.value})}
                placeholder="Yozma javobni kiriting..."
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Rasm URL</Label>
              <Input
                id="imageUrl"
                value={newQuestion.imageUrl}
                onChange={(e) => setNewQuestion({...newQuestion, imageUrl: e.target.value})}
                placeholder="Rasm URL manzilini kiriting..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">YouTube URL</Label>
              <Input
                id="youtubeUrl"
                value={newQuestion.youtubeUrl}
                onChange={(e) => setNewQuestion({...newQuestion, youtubeUrl: e.target.value})}
                placeholder="YouTube video URL manzilini kiriting..."
              />
            </div>
            
                         {(newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") && (
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <Label>Variantlar *</Label>
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm" 
                     onClick={addNewOption}
                   >
                     <Plus className="h-4 w-4 mr-1" />
                     Variant qo'shish
                   </Button>
                 </div>
                 
                 {/* Validation Errors */}
                 {getValidationErrors().length > 0 && (
                   <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                     {getValidationErrors().map((error, index) => (
                       <p key={index} className="text-red-600 text-sm">{error}</p>
                     ))}
                   </div>
                 )}
                 
                 {newQuestion.options.map((option, index) => (
                   <div key={index} className="space-y-2">
                     <div className="flex gap-2 items-center">
                       <Input
                         placeholder={`Variant ${index + 1}`}
                         value={option.answerText}
                         onChange={(e) => {
                           const updatedOptions = [...newQuestion.options]
                           updatedOptions[index].answerText = e.target.value
                           setNewQuestion({...newQuestion, options: updatedOptions})
                         }}
                         className={option.answerText.trim() === "" ? "border-red-300 focus:border-red-500" : ""}
                       />
                       <input
                         type="radio"
                         name="correctOption"
                         checked={option.isCorrect}
                         onChange={() => {
                           const updatedOptions = newQuestion.options.map((opt, i) => ({
                             ...opt,
                             isCorrect: i === index
                           }))
                           setNewQuestion({...newQuestion, options: updatedOptions})
                         }}
                       />
                       <Label className="text-sm">To'g'ri javob</Label>
                       {newQuestion.options.length > 2 && (
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => removeOption(index)}
                           className="text-red-600 hover:text-red-700"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                     
                     {/* Show error for empty option */}
                     {option.answerText.trim() === "" && (
                       <p className="text-red-500 text-xs">Bu variant to'ldirilishi shart</p>
                     )}
                   </div>
                 ))}
               </div>
             )}

             {newQuestion.questionType === "WRITTEN_ANSWER" && (
               <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                 <p className="text-blue-600 text-sm">
                   Yozma savol turi uchun variantlar kerak emas. Foydalanuvchi javobni yozadi.
                 </p>
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
                        #{question.position}
                      </Badge>
                      <Badge variant="outline">{getQuestionTypeText(question.questionType)}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                                 {question.options && question.options.length > 0 && (
                   <div className="mb-4">
                     <Label className="text-sm font-medium mb-2 block">Variantlar:</Label>
                     <div className="space-y-2">
                       {question.options.map((option, index) => (
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
                
                {question.writtenAnswer && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Yozma javob:</Label>
                    <p className="text-sm text-gray-700">{question.writtenAnswer}</p>
                  </div>
                )}
                
                {question.imageUrl && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">Rasm:</Label>
                    <a href={question.imageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {question.imageUrl}
                    </a>
                  </div>
                )}
                
                {question.youtubeUrl && (
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-2 block">YouTube video:</Label>
                    <a href={question.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {question.youtubeUrl}
                    </a>
                  </div>
                )}
                
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>Pozitsiya: #{question.position}</span>
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
                {searchTerm || subjectFilter || typeFilter || statusFilter 
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
               <Label htmlFor="edit-questionType">Savol turi</Label>
               <Select value={newQuestion.questionType} onValueChange={(value) => {
                 if (value === "MULTIPLE_CHOICE" || value === "SINGLE_CHOICE") {
                   // For choice questions, clear written answer and set default options
                   setNewQuestion(prev => ({
                     ...prev,
                     questionType: value,
                     writtenAnswer: "",
                     options: [
                       { answerText: "", imageUrl: "", isCorrect: false },
                       { answerText: "", imageUrl: "", isCorrect: false }
                     ]
                   }))
                 } else if (value === "WRITTEN_ANSWER") {
                   // For written answer questions, clear options
                   setNewQuestion(prev => ({
                     ...prev,
                     questionType: value,
                     options: []
                   }))
                 }
               }}>
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
              <Label htmlFor="edit-position">Pozitsiya</Label>
              <Input
                id="edit-position"
                type="number"
                value={newQuestion.position}
                onChange={(e) => setNewQuestion({...newQuestion, position: e.target.value})}
                placeholder="Savol pozitsiyasini kiriting..."
              />
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
          
          <div className="space-y-2">
            <Label htmlFor="edit-writtenAnswer">Yozma javob</Label>
            <Textarea
              id="edit-writtenAnswer"
              value={newQuestion.writtenAnswer}
              onChange={(e) => setNewQuestion({...newQuestion, writtenAnswer: e.target.value})}
              placeholder="Yozma javobni kiriting..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-imageUrl">Rasm URL</Label>
            <Input
              id="edit-imageUrl"
              value={newQuestion.imageUrl}
              onChange={(e) => setNewQuestion({...newQuestion, imageUrl: e.target.value})}
              placeholder="Rasm URL manzilini kiriting..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-youtubeUrl">YouTube URL</Label>
            <Input
              id="edit-youtubeUrl"
              value={newQuestion.youtubeUrl}
              onChange={(e) => setNewQuestion({...newQuestion, youtubeUrl: e.target.value})}
              placeholder="YouTube video URL manzilini kiriting..."
            />
          </div>
          
                                           {(newQuestion.questionType === "MULTIPLE_CHOICE" || newQuestion.questionType === "SINGLE_CHOICE") && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Variantlar *</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addNewOption}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Variant qo'shish
                  </Button>
                </div>
                
                {/* Validation Errors */}
                {getValidationErrors().length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    {getValidationErrors().map((error, index) => (
                      <p key={index} className="text-red-600 text-sm">{error}</p>
                    ))}
                  </div>
                )}
                
                                 {newQuestion.options.map((option, index) => (
                   <div key={index} className="space-y-2">
                     <div className="flex gap-2 items-center">
                       <Input
                         placeholder={`Variant ${index + 1}`}
                         value={option.answerText}
                         onChange={(e) => {
                           const updatedOptions = [...newQuestion.options]
                           updatedOptions[index].answerText = e.target.value
                           setNewQuestion({...newQuestion, options: updatedOptions})
                         }}
                         className={option.answerText.trim() === "" ? "border-red-300 focus:border-red-500" : ""}
                       />
                       <input
                         type="radio"
                         name="editCorrectOption"
                         checked={option.isCorrect}
                         onChange={() => {
                           const updatedOptions = newQuestion.options.map((opt, i) => ({
                             ...opt,
                             isCorrect: i === index
                           }))
                           setNewQuestion({...newQuestion, options: updatedOptions})
                         }}
                       />
                       <Label className="text-sm">To'g'ri javob</Label>
                       {newQuestion.options.length > 2 && (
                         <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => removeOption(index)}
                           className="text-red-600 hover:text-red-700"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                     
                     {/* Show error for empty option */}
                     {option.answerText.trim() === "" && (
                       <p className="text-red-500 text-xs">Bu variant to'ldirilishi shart</p>
                     )}
                   </div>
                 ))}
              </div>
            )}

            {newQuestion.questionType === "WRITTEN_ANSWER" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-600 text-sm">
                  Yozma savol turi uchun variantlar kerak emas. Foydalanuvchi javobni yozadi.
                </p>
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
