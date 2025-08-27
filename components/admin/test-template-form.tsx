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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, 
  Trash2, 
  Edit, 
  Eye,
  Save,
  ArrowLeft,
  BookOpen,
  Clock,
  DollarSign
} from "lucide-react"
import { apiService } from "@/lib/api"

interface TestQuestion {
  questionType: "WRITTEN_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE"
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

interface TestSubject {
  subjectId: number
  subjectRole: "MAIN" | "SECONDARY"
  testQuestions: TestQuestion[]
}

interface TestTemplateFormData {
  title: string
  duration: number
  price: number
  testSubjectsAndQuestions: TestSubject[]
}

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

interface Props {
  templateId?: string
  initialData?: TestTemplateFormData
  mode: "create" | "edit"
  onSuccess?: () => void
  onCancel?: () => void
}

export function TestTemplateForm({ templateId, initialData, mode, onSuccess, onCancel }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TestTemplateFormData>({
    title: "",
    duration: 3600,
    price: 10000,
    testSubjectsAndQuestions: []
  })

  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false)
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [editingSubjectIndex, setEditingSubjectIndex] = useState<number | null>(null)
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      // Default structure with one main subject
      setFormData({
        title: "",
        duration: 3600,
        price: 10000,
        testSubjectsAndQuestions: [
          {
            subjectId: 0,
            subjectRole: "MAIN",
            testQuestions: []
          }
        ]
      })
    }
  }, [initialData])

  // Fetch subjects
  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects()
      if (response.success) {
        setSubjects(response.data || [])
      }
    } catch (err) {
      console.error("Error fetching subjects:", err)
    }
  }

  const handleAddSubject = () => {
    setEditingSubjectIndex(null)
    setIsAddSubjectDialogOpen(true)
  }

  const handleEditSubject = (index: number) => {
    setEditingSubjectIndex(index)
    setIsAddSubjectDialogOpen(true)
  }

  const handleDeleteSubject = (index: number) => {
    const newSubjects = [...formData.testSubjectsAndQuestions]
    newSubjects.splice(index, 1)
    setFormData({ ...formData, testSubjectsAndQuestions: newSubjects })
  }

  const handleSaveSubject = (subjectData: { subjectId: number; subjectRole: "MAIN" | "SECONDARY" }) => {
    if (editingSubjectIndex !== null) {
      // Edit existing subject
      const newSubjects = [...formData.testSubjectsAndQuestions]
      newSubjects[editingSubjectIndex] = {
        ...newSubjects[editingSubjectIndex],
        ...subjectData
      }
      setFormData({ ...formData, testSubjectsAndQuestions: newSubjects })
    } else {
      // Add new subject
      setFormData({
        ...formData,
        testSubjectsAndQuestions: [
          ...formData.testSubjectsAndQuestions,
          {
            ...subjectData,
            testQuestions: []
          }
        ]
      })
    }
    setIsAddSubjectDialogOpen(false)
  }

  const handleAddQuestion = (subjectIndex: number) => {
    setEditingQuestionIndex(null)
    setEditingSubjectIndex(subjectIndex)
    setIsAddQuestionDialogOpen(true)
  }

  const handleEditQuestion = (subjectIndex: number, questionIndex: number) => {
    setEditingSubjectIndex(subjectIndex)
    setEditingQuestionIndex(questionIndex)
    setIsAddQuestionDialogOpen(true)
  }

  const handleDeleteQuestion = (subjectIndex: number, questionIndex: number) => {
    const newSubjects = [...formData.testSubjectsAndQuestions]
    newSubjects[subjectIndex].testQuestions.splice(questionIndex, 1)
    setFormData({ ...formData, testSubjectsAndQuestions: newSubjects })
  }

  const handleSaveQuestion = (questionData: TestQuestion) => {
    // Ensure data structure is correct based on question type
    let cleanedQuestionData: TestQuestion
    
    if (questionData.questionType === "WRITTEN_ANSWER") {
      cleanedQuestionData = {
        ...questionData,
        options: [], // WRITTEN_ANSWER uchun options bo'sh
        writtenAnswer: questionData.writtenAnswer.trim()
      }
    } else {
      cleanedQuestionData = {
        ...questionData,
        // SINGLE_CHOICE/MULTIPLE_CHOICE uchun writtenAnswer o'zgarishsiz qoladi
        options: questionData.options.filter(opt => opt.answerText.trim() !== "") // Bo'sh optionlarni olib tashlash
      }
    }
    
    if (editingQuestionIndex !== null && editingSubjectIndex !== null) {
      // Edit existing question
      const newSubjects = [...formData.testSubjectsAndQuestions]
      newSubjects[editingSubjectIndex].testQuestions[editingQuestionIndex] = cleanedQuestionData
      setFormData({ ...formData, testSubjectsAndQuestions: newSubjects })
    } else if (editingSubjectIndex !== null) {
      // Add new question
      const newSubjects = [...formData.testSubjectsAndQuestions]
      newSubjects[editingSubjectIndex].testQuestions.push(cleanedQuestionData)
      setFormData({ ...formData, testSubjectsAndQuestions: newSubjects })
    }
    setIsAddQuestionDialogOpen(false)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError("Test nomini kiriting")
      return
    }

    if (formData.testSubjectsAndQuestions.length === 0) {
      setError("Kamida bitta fan qo'shish kerak")
      return
    }

    // Validate that all subjects have questions
    for (let i = 0; i < formData.testSubjectsAndQuestions.length; i++) {
      const subject = formData.testSubjectsAndQuestions[i]
      if (subject.testQuestions.length === 0) {
        setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} uchun savollar qo'shilmagan`)
        return
      }
      
      // Validate each question's type and options structure
      for (let j = 0; j < subject.testQuestions.length; j++) {
        const question = subject.testQuestions[j]
        
        if (question.questionType === "WRITTEN_ANSWER") {
          // WRITTEN_ANSWER savollar uchun options bo'sh bo'lishi kerak
          if (question.options.length > 0) {
            setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} - Savol #${question.position}: Yozma savol uchun variantlar bo'lishi mumkin emas`)
            return
          }
          // writtenAnswer to'ldirilishi shart
          if (!question.writtenAnswer.trim()) {
            setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} - Savol #${question.position}: Yozma javob to'ldirilishi shart`)
            return
          }
        } else if (question.questionType === "SINGLE_CHOICE" || question.questionType === "MULTIPLE_CHOICE") {
          // SINGLE_CHOICE va MULTIPLE_CHOICE savollar uchun options bo'lishi shart
          if (question.options.length === 0) {
            setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} - Savol #${question.position}: Tanlovli savol uchun variantlar bo'lishi shart`)
            return
          }
          
          // Kamida 2 ta variant to'ldirilishi shart
          const filledOptions = question.options.filter(opt => opt.answerText.trim() !== "")
          if (filledOptions.length < 2) {
            setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} - Savol #${question.position}: Kamida 2 ta variant to'ldirilishi kerak`)
            return
          }
          
          // Kamida 1 ta to'g'ri javob tanlanishi shart
          if (!question.options.some(opt => opt.isCorrect)) {
            setError(`${subjects.find(s => s.id === subject.subjectId)?.name || 'Fan'} - Savol #${question.position}: Kamida 1 ta to'g'ri javob tanlanishi kerak`)
            return
          }
          
          // writtenAnswer ixtiyoriy maydon, validatsiya qilish shart emas
        }
      }
    }

    setLoading(true)
    setError(null)

    // Prepare data for API - ensure correct structure
    const apiData = {
      ...formData,
      testSubjectsAndQuestions: formData.testSubjectsAndQuestions.map(subject => ({
        ...subject,
        testQuestions: subject.testQuestions.map(question => {
          if (question.questionType === "WRITTEN_ANSWER") {
            // WRITTEN_ANSWER uchun options bo'sh, writtenAnswer saqlanadi
            return {
              ...question,
              options: [],
              writtenAnswer: question.writtenAnswer.trim()
            }
          } else {
            // SINGLE_CHOICE/MULTIPLE_CHOICE uchun writtenAnswer o'zgarishsiz, options saqlanadi
            return {
              ...question,
              options: question.options.filter(opt => opt.answerText.trim() !== "")
            }
          }
        })
      }))
    }

    try {
      if (mode === "create") {
        const response = await apiService.createTestTemplate(apiData)
        if (response.success) {
          onSuccess?.()
          router.push("/admin/test-templates")
        } else {
          setError(response.message || "Test yaratishda xatolik")
        }
              } else if (mode === "edit" && templateId) {
          const response = await apiService.updateTestTemplate(templateId, apiData)
        if (response.success) {
          onSuccess?.()
          router.push("/admin/test-templates")
        } else {
          setError(response.message || "Test yangilashda xatolik")
        }
      }
    } catch (err) {
      console.error("Error saving template:", err)
      setError("Saqlashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const getSubjectName = (subjectId: number) => {
    return subjects.find(s => s.id === subjectId)?.name || `Subject ${subjectId}`
  }

  const getQuestionTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      "MULTIPLE_CHOICE": "Ko'p tanlovli",
      "SINGLE_CHOICE": "Bitta tanlovli",
      "WRITTEN_ANSWER": "Yozma savol"
    }
    return types[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={onCancel || (() => router.back())}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === "create" ? "Yangi Test Yaratish" : "Testni Tahrirlash"}
            </h1>
          </div>
          <p className="text-gray-600">
            Test ma'lumotlarini to'ldiring va savollar qo'shing
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Basic Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
            <CardDescription>
              Test nomi, vaqti va narxini belgilang
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Test nomi *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Test nomini kiriting..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Vaqt (sekund) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  placeholder="3600"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Narx (so'm) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects and Questions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fanlar va Savollar</CardTitle>
                <CardDescription>
                  Test fanlarini va savollarini boshqaring
                </CardDescription>
              </div>
              <Button onClick={handleAddSubject}>
                <Plus className="h-4 w-4 mr-2" />
                Fan Qo'shish
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.testSubjectsAndQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Hali hech qanday fan qo'shilmagan</p>
                <p className="text-sm">Test yaratish uchun fan qo'shing</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.testSubjectsAndQuestions.map((subject, subjectIndex) => (
                  <div key={subjectIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={subject.subjectRole === "MAIN" ? "default" : "secondary"}>
                          {subject.subjectRole === "MAIN" ? "Asosiy" : "Qo'shimcha"}
                        </Badge>
                        <span className="font-medium">
                          {getSubjectName(subject.subjectId)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSubject(subjectIndex)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Tahrirlash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuestion(subjectIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Savol Qo'shish
                        </Button>
                        {formData.testSubjectsAndQuestions.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubject(subjectIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Questions List */}
                    {subject.testQuestions.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        <p>Bu fan uchun savollar qo'shilmagan</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {subject.testQuestions.map((question, questionIndex) => (
                          <div key={questionIndex} className="bg-gray-50 rounded-md p-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">#{question.position}</Badge>
                                <Badge variant="outline">
                                  {getQuestionTypeText(question.questionType)}
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditQuestion(subjectIndex, questionIndex)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Tahrirlash
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteQuestion(subjectIndex, questionIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">
                              {question.questionText}
                            </p>
                            
                            {question.questionType !== "WRITTEN_ANSWER" && question.options.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {question.options.length} ta variant
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={onCancel || (() => router.back())}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saqlanmoqda..." : (mode === "create" ? "Yaratish" : "Saqlash")}
          </Button>
        </div>
      </div>

      {/* Add/Edit Subject Dialog */}
      <SubjectDialog
        open={isAddSubjectDialogOpen}
        onOpenChange={setIsAddSubjectDialogOpen}
        subjects={subjects}
        onSave={handleSaveSubject}
        editingSubject={editingSubjectIndex !== null ? formData.testSubjectsAndQuestions[editingSubjectIndex] : null}
      />

      {/* Add/Edit Question Dialog */}
      <QuestionDialog
        open={isAddQuestionDialogOpen}
        onOpenChange={setIsAddQuestionDialogOpen}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestionIndex !== null && editingSubjectIndex !== null 
          ? formData.testSubjectsAndQuestions[editingSubjectIndex].testQuestions[editingQuestionIndex] 
          : null}
      />
    </div>
  )
}

// Subject Dialog Component
function SubjectDialog({ 
  open, 
  onOpenChange, 
  subjects, 
  onSave, 
  editingSubject 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects: Subject[]
  onSave: (data: { subjectId: number; subjectRole: "MAIN" | "SECONDARY" }) => void
  editingSubject: TestSubject | null
}) {
  const [subjectId, setSubjectId] = useState("")
  const [subjectRole, setSubjectRole] = useState<"MAIN" | "SECONDARY">("MAIN")

  useEffect(() => {
    if (editingSubject) {
      setSubjectId(editingSubject.subjectId.toString())
      setSubjectRole(editingSubject.subjectRole)
    } else {
      setSubjectId("")
      setSubjectRole("MAIN")
    }
  }, [editingSubject])

  const handleSave = () => {
    if (!subjectId) return
    onSave({
      subjectId: parseInt(subjectId),
      subjectRole
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSubject ? "Fanni Tahrirlash" : "Yangi Fan Qo'shish"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fan</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
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
            <Label>Fan roli</Label>
            <Select value={subjectRole} onValueChange={(value: "MAIN" | "SECONDARY") => setSubjectRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MAIN">Asosiy</SelectItem>
                <SelectItem value="SECONDARY">Qo'shimcha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave} disabled={!subjectId}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Question Dialog Component
function QuestionDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  editingQuestion 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: TestQuestion) => void
  editingQuestion: TestQuestion | null
}) {
  const [questionData, setQuestionData] = useState<TestQuestion>({
    questionType: "SINGLE_CHOICE",
    questionText: "",
    writtenAnswer: "",
    imageUrl: "",
    youtubeUrl: "",
    position: "1",
    options: [
      { answerText: "", imageUrl: "", isCorrect: false },
      { answerText: "", imageUrl: "", isCorrect: false }
    ]
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    // Validation xatolarini tozalash
    setValidationErrors([])
    
    if (editingQuestion) {
      setQuestionData(editingQuestion)
    } else {
      setQuestionData({
        questionType: "SINGLE_CHOICE",
        questionText: "",
        writtenAnswer: "",
        imageUrl: "",
        youtubeUrl: "",
        position: "1",
        options: [
          { answerText: "", imageUrl: "", isCorrect: false },
          { answerText: "", imageUrl: "", isCorrect: false }
        ]
      })
    }
  }, [editingQuestion])

  const handleQuestionTypeChange = (type: "WRITTEN_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE") => {
    // Savol turi o'zgarganda validation xatolarini tozalash
    setValidationErrors([])
    
    if (type === "WRITTEN_ANSWER") {
      // WRITTEN_ANSWER tanlanganda, faqat options tozalanadi
      setQuestionData({
        ...questionData,
        questionType: type,
        options: []
      })
    } else {
      // SINGLE_CHOICE yoki MULTIPLE_CHOICE tanlanganda, faqat options qo'shiladi
      setQuestionData({
        ...questionData,
        questionType: type,
        options: [
          { answerText: "", imageUrl: "", isCorrect: false },
          { answerText: "", imageUrl: "", isCorrect: false }
        ]
      })
    }
  }

  const addOption = () => {
    setQuestionData({
      ...questionData,
      options: [...questionData.options, { answerText: "", imageUrl: "", isCorrect: false }]
    })
  }

  const removeOption = (index: number) => {
    if (questionData.options.length > 2) {
      const newOptions = questionData.options.filter((_, i) => i !== index)
      setQuestionData({ ...questionData, options: newOptions })
    }
  }

  const updateOption = (index: number, field: keyof typeof questionData.options[0], value: string | boolean) => {
    const newOptions = [...questionData.options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setQuestionData({ ...questionData, options: newOptions })
    
    // Agar variant to'ldirilsa, validation xatolarini tozalash
    if (field === "answerText" && value.trim() !== "") {
      setValidationErrors(prev => prev.filter(error => !error.includes("variant")))
    }
  }

  const validateForm = () => {
    const errors: string[] = []
    
    if (!questionData.questionText.trim()) {
      errors.push("Savol matni to'ldirilishi shart")
    }
    
    if (questionData.questionType === "WRITTEN_ANSWER") {
      // WRITTEN_ANSWER turida writtenAnswer to'ldirilishi shart
      if (!questionData.writtenAnswer.trim()) {
        errors.push("Yozma javob to'ldirilishi shart")
      }
    } else {
      // SINGLE_CHOICE yoki MULTIPLE_CHOICE turida options to'ldirilishi shart
      const filledOptions = questionData.options.filter(opt => opt.answerText.trim() !== "")
      if (filledOptions.length < 2) {
        errors.push("Kamida 2 ta variant to'ldirilishi kerak")
      }
      if (!questionData.options.some(opt => opt.isCorrect)) {
        errors.push("Kamida 1 ta to'g'ri javob tanlanishi kerak")
      }
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      // Validation muvaffaqiyatli bo'lsa xatolarni tozalash
      setValidationErrors([])
      onSave(questionData)
    } else {
      // Validation xatosi bo'lsa, foydalanuvchiga xabar berish
      console.log("Validation errors:", validationErrors)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingQuestion ? "Savolni Tahrirlash" : "Yangi Savol Qo'shish"}
          </DialogTitle>
        </DialogHeader>
        
                 <div className="space-y-4">
           {/* Validation Errors */}
           {validationErrors.length > 0 && (
             <div className="p-3 bg-red-50 border border-red-200 rounded-md">
               {validationErrors.map((error, index) => (
                 <p key={index} className="text-red-600 text-sm">{error}</p>
               ))}
             </div>
           )}
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Savol turi</Label>
              <Select value={questionData.questionType} onValueChange={handleQuestionTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_CHOICE">Bitta tanlovli</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlovli</SelectItem>
                  <SelectItem value="WRITTEN_ANSWER">Yozma savol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Pozitsiya</Label>
              <Input
                type="number"
                value={questionData.position}
                onChange={(e) => setQuestionData({ ...questionData, position: e.target.value })}
                placeholder="1"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Savol matni *</Label>
            <Textarea
              value={questionData.questionText}
              onChange={(e) => setQuestionData({ ...questionData, questionText: e.target.value })}
              placeholder="Savol matnini kiriting..."
              rows={3}
            />
          </div>
          
                     {/* Yozma javob faqat WRITTEN_ANSWER turida ko'rsatiladi */}
           {questionData.questionType === "WRITTEN_ANSWER" && (
             <div className="space-y-2">
               <Label>Yozma javob *</Label>
               <Textarea
                 value={questionData.writtenAnswer}
                 onChange={(e) => setQuestionData({ ...questionData, writtenAnswer: e.target.value })}
                 placeholder="Yozma javobni kiriting..."
                 rows={2}
               />
             </div>
           )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rasm URL</Label>
              <Input
                value={questionData.imageUrl}
                onChange={(e) => setQuestionData({ ...questionData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.png"
              />
            </div>
            
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input
                value={questionData.youtubeUrl}
                onChange={(e) => setQuestionData({ ...questionData, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
          
                     {/* Options for choice questions */}
           {questionData.questionType !== "WRITTEN_ANSWER" && (
             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <Label>Variantlar *</Label>
                 <Button variant="outline" size="sm" onClick={addOption}>
                   <Plus className="h-4 w-4 mr-2" />
                   Variant qo'shish
                 </Button>
               </div>
               
               {/* Options validation info */}
               <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                 <p className="text-yellow-700 text-sm">
                   Kamida 2 ta variant to'ldirilishi va 1 ta to'g'ri javob tanlanishi kerak
                 </p>
               </div>
              
              {questionData.options.map((option, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex gap-2 items-center">
                                      <Input
                      placeholder={`Variant ${index + 1}`}
                      value={option.answerText}
                      onChange={(e) => updateOption(index, "answerText", e.target.value)}
                      className={`flex-1 ${option.answerText.trim() === "" ? "border-red-300 focus:border-red-500" : ""}`}
                    />
                  <Input
                    placeholder="Rasm URL (ixtiyoriy)"
                    value={option.imageUrl}
                    onChange={(e) => updateOption(index, "imageUrl", e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="radio"
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={() => updateOption(index, "isCorrect", true)}
                  />
                  <Label className="text-sm">To'g'ri</Label>
                  {questionData.options.length > 2 && (
                    <Button
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
          
          {/* Info for written answer questions */}
          {questionData.questionType === "WRITTEN_ANSWER" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-600 text-sm">
                Yozma savol turi uchun variantlar kerak emas. Foydalanuvchi javobni yozadi.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSave}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
