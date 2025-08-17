"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Plus, 
  Upload, 
  X,
  Check,
  Image as ImageIcon,
  Youtube,
  Star,
  FileText
} from "lucide-react"
import { apiService } from "@/lib/api"

interface Subject {
  id: number
  name: string
  calculator: boolean
  imageUrl: string
}

interface Topic {
  id: number
  name: string
  subjectId: number
}

interface AnswerOption {
  id: string
  text: string
  imageFile: File | null
  isCorrect: boolean
}

export function AddQuestionForm() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    subjectId: "",
    topicId: "",
    questionText: "",
    questionImage: null as File | null,
    youtubeUrl: "",
    difficultyLevel: 3,
    testType: "SINGLE_CHOICE",
    answerOptions: [
      { id: "1", text: "", imageFile: null, isCorrect: true },
      { id: "2", text: "", imageFile: null, isCorrect: false },
      { id: "3", text: "", imageFile: null, isCorrect: false },
      { id: "4", text: "", imageFile: null, isCorrect: false }
    ] as AnswerOption[]
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (formData.subjectId) {
      fetchTopics(parseInt(formData.subjectId))
    }
  }, [formData.subjectId])

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects()
      if (response.success) {
        setSubjects(response.data || [])
      }
    } catch (error) {
      console.error("Error fetching subjects:", error)
    }
  }

  const fetchTopics = async (subjectId: number) => {
    try {
      // Mock topics for now - replace with actual API call
      const mockTopics: Topic[] = [
        { id: 1, name: "Algebra", subjectId },
        { id: 2, name: "Geometriya", subjectId },
        { id: 3, name: "Trigonometriya", subjectId },
        { id: 4, name: "Kalkulyus", subjectId }
      ]
      setTopics(mockTopics)
    } catch (error) {
      console.error("Error fetching topics:", error)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'answer', answerId?: string) => {
    const file = event.target.files?.[0]
    if (file) {
      if (type === 'question') {
        setFormData(prev => ({ ...prev, questionImage: file }))
      } else if (type === 'answer' && answerId) {
        setFormData(prev => ({
          ...prev,
          answerOptions: prev.answerOptions.map(opt => 
            opt.id === answerId ? { ...opt, imageFile: file } : opt
          )
        }))
      }
    }
  }

  const removeImage = (type: 'question' | 'answer', answerId?: string) => {
    if (type === 'question') {
      setFormData(prev => ({ ...prev, questionImage: null }))
    } else if (type === 'answer' && answerId) {
      setFormData(prev => ({
        ...prev,
        answerOptions: prev.answerOptions.map(opt => 
          opt.id === answerId ? { ...opt, imageFile: null } : opt
        )
      }))
    }
  }

  const addAnswerOption = () => {
    const newId = (formData.answerOptions.length + 1).toString()
    setFormData(prev => ({
      ...prev,
      answerOptions: [...prev.answerOptions, { 
        id: newId, 
        text: "", 
        imageFile: null, 
        isCorrect: false 
      }]
    }))
  }

  const removeAnswerOption = (id: string) => {
    if (formData.answerOptions.length > 2) {
      setFormData(prev => ({
        ...prev,
        answerOptions: prev.answerOptions.filter(opt => opt.id !== id)
      }))
    }
  }

  const setCorrectAnswer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.map(opt => ({
        ...opt,
        isCorrect: opt.id === id
      }))
    }))
  }

  const updateAnswerOption = (id: string, field: 'text' | 'imageFile', value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      answerOptions: prev.answerOptions.map(opt => 
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validate form
      if (!formData.subjectId || !formData.topicId || !formData.questionText) {
        alert("Iltimos, barcha majburiy maydonlarni to'ldiring")
        return
      }

      if (formData.answerOptions.filter(opt => opt.text.trim()).length < 2) {
        alert("Kamida 2 ta javob variantini kiriting")
        return
      }

      if (!formData.answerOptions.some(opt => opt.isCorrect)) {
        alert("Iltimos, to'g'ri javobni belgilang")
        return
      }

      // Here you would typically send the data to your API
      console.log("Form data:", formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert("Savol muvaffaqiyatli qo'shildi!")
      router.push("/admin/questions")
      
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
    } finally {
      setLoading(false)
    }
  }

  const getTestTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      "SINGLE_CHOICE": "1 ta to'g'ri javob",
      "MULTIPLE_CHOICE": "Ko'p tanlovli",
      "TRUE_FALSE": "To'g'ri/Noto'g'ri",
      "ESSAY": "Izohli savol"
    }
    return types[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-700">+ Yangi savol qo'shish</h1>
              <p className="text-gray-600 mt-1">Test savolini yarating va boshqaring</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => router.push("/admin/questions")}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <button
              onClick={() => router.push("/admin/questions")}
              className="hover:text-blue-600 transition-colors"
            >
              Savollar
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Yangi savol</span>
          </nav>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Asosiy ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                    Fan <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.subjectId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value, topicId: "" }))}
                  >
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Fanni tanlang" />
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

                {/* Topic Selection */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Mavzu <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.topicId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, topicId: value }))}
                    disabled={!formData.subjectId}
                  >
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue placeholder="Mavzuni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="questionText" className="text-sm font-medium text-gray-700">
                  Savol matni <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
                  placeholder="Savolni yozing..."
                  rows={4}
                  className="min-h-[120px] border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Media and Settings Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                Media va sozlamalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Question Image */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Savol rasmi (ixtiyoriy)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    {formData.questionImage ? (
                      <div className="text-center">
                        <div className="relative inline-block">
                          <img
                            src={URL.createObjectURL(formData.questionImage)}
                            alt="Question preview"
                            className="max-h-32 rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImage('question')}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{formData.questionImage.name}</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Rasm yuklash uchun bosing</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'question')}
                          className="hidden"
                          id="questionImage"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('questionImage')?.click()}
                        >
                          Выберите файл
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* YouTube Link */}
                <div className="space-y-3">
                  <Label htmlFor="youtubeUrl" className="text-sm font-medium text-gray-700">
                    YouTube havolasi (ixtiyoriy)
                  </Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      placeholder="https://youtu.be/..."
                      className="pl-10 h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Difficulty Level */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Qiyinlik darajasi (1-5)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.difficultyLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, difficultyLevel: parseInt(e.target.value) }))}
                      className="w-20 h-12 text-center border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors"
                    />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Star
                          key={level}
                          className={`h-5 w-5 cursor-pointer transition-colors ${
                            level <= formData.difficultyLevel
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, difficultyLevel: level }))}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Type */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Test turi
                  </Label>
                  <Select 
                    value={formData.testType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, testType: value }))}
                  >
                    <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_CHOICE">1 ta to'g'ri javob</SelectItem>
                      <SelectItem value="MULTIPLE_CHOICE">Ko'p tanlovli</SelectItem>
                      <SelectItem value="TRUE_FALSE">To'g'ri/Noto'g'ri</SelectItem>
                      <SelectItem value="ESSAY">Izohli savol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Answer Options Card */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Javob variantlari
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.answerOptions.map((option, index) => (
                <div key={option.id} className="relative">
                  <div className="flex items-start gap-3">
                    {/* Answer Text Input */}
                    <div className="flex-1">
                      <Input
                        placeholder={index === 0 ? "To'g'ri javob" : `Variant ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updateAnswerOption(option.id, 'text', e.target.value)}
                        className={`h-12 border-2 transition-colors ${
                          option.isCorrect 
                            ? "border-green-300 bg-green-50 focus:border-green-500" 
                            : "border-gray-200 hover:border-blue-300 focus:border-blue-500"
                        }`}
                      />
                    </div>

                    {/* Image Upload for Answer */}
                    <div className="flex items-center gap-2">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-blue-400 transition-colors">
                        {option.imageFile ? (
                          <div className="relative">
                            <img
                              src={URL.createObjectURL(option.imageFile)}
                              alt="Answer preview"
                              className="h-8 w-8 rounded object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0"
                              onClick={() => removeImage('answer', option.id)}
                            >
                              <X className="h-2 w-2" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'answer', option.id)}
                              className="hidden"
                              id={`answerImage-${option.id}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => document.getElementById(`answerImage-${option.id}`)?.click()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Correct Answer Radio */}
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={option.isCorrect}
                          onChange={() => setCorrectAnswer(option.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <Label className="text-sm text-gray-700">To'g'ri</Label>
                      </div>

                      {/* Remove Answer Option */}
                      {formData.answerOptions.length > 2 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => removeAnswerOption(option.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Correct Answer Badge */}
                  {option.isCorrect && (
                    <div className="absolute -top-2 left-4">
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        To'g'ri javob
                      </Badge>
                    </div>
                  )}
                </div>
              ))}

              {/* Add More Answer Options */}
              <div className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAnswerOption}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yana javob qo'shish
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-12 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saqlanmoqda...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Saqlash
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
