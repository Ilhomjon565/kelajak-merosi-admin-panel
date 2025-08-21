"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Trash2, Save, CheckCircle } from "lucide-react"

import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

interface TestQuestionOption {
    answerText: string
    imageUrl: string
    isCorrect: boolean
}

interface TestQuestion {
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "WRITTEN_ANSWER" | "WRITTEN"
    questionText: string
    writtenAnswer: string
    imageUrl: string
    youtubeUrl: string
    position: string
    options: TestQuestionOption[]
}

interface TestTemplateForm {
    title: string
    duration: string
    price: string
    imageUrl: string
    subjectId: string
    subjectRole: "MAIN" | "SECONDARY"
    subjectName: string
    questions: TestQuestion[]
}

function QuestionsPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Get subject index from URL params
    const subjectIndex = searchParams.get('subjectIndex') ? parseInt(searchParams.get('subjectIndex')!) : null

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [questions, setQuestions] = useState<TestQuestion[]>([])
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
            { answerText: "", imageUrl: "", isCorrect: false },
        ],
    })

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "0",
        imageUrl: "",
        subjectId: "",
        subjectRole: "MAIN",
        subjectName: "",
        questions: []
    })

    useEffect(() => {
        // Load data from localStorage
        const storedData = localStorage.getItem('testTemplateData')
        if (storedData && subjectIndex !== null) {
            try {
                const data = JSON.parse(storedData)
                const currentSubject = data.subjectWithQuestions[subjectIndex]
                
                if (currentSubject) {
                    setForm({
                        title: data.title,
                        duration: data.duration,
                        price: data.price,
                        imageUrl: data.imageUrl,
                        subjectId: currentSubject.subjectId,
                        subjectRole: currentSubject.subjectRole,
                        subjectName: currentSubject.subjectName,
                        questions: currentSubject.questions || []
                    })
                    setQuestions(currentSubject.questions || [])
                }
            } catch (error) {
                console.error('Error parsing stored data:', error)
            }
        }
        setLoading(false)
    }, [subjectIndex])

    const handleImageUpload = async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("https://api.kelajakmerosi.uz/api/template/image/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiService.getAccessToken()}` },
            body: formData,
        })
        const json = await res.json()
        if (json?.success) return json.data
        throw new Error(json?.message || "Rasm yuklashda xatolik")
    }

    const updateCurrentQuestionOption = (
        optionIndex: number,
        field: "answerText" | "imageUrl" | "isCorrect",
        value: string | boolean,
    ) => {
        const updated = { ...currentQuestion }
        if (field === "isCorrect") {
            if (updated.questionType === "SINGLE_CHOICE") {
                updated.options.forEach((opt, i) => {
                    opt.isCorrect = i === optionIndex ? (value as boolean) : false
                })
            } else {
                updated.options[optionIndex].isCorrect = value as boolean
            }
        } else {
            updated.options[optionIndex][field] = value as string
        }
        setCurrentQuestion(updated)
    }

    const addOptionRow = () => {
        setCurrentQuestion((prev) => ({
            ...prev,
            options: [
                ...prev.options,
                { answerText: "", imageUrl: "", isCorrect: false },
            ],
        }))
    }

    const removeOptionRow = (index: number) => {
        setCurrentQuestion((prev) => {
            if (prev.options.length <= 2) return prev
            const nextOptions = prev.options.filter((_, i) => i !== index)
            return { ...prev, options: nextOptions }
        })
    }

    const addQuestion = () => {
        if (!currentQuestion.questionText.trim()) {
            alert("Savol matnini kiriting")
            return
        }
        if (!currentQuestion.position) {
            alert("Tartib raqamini kiriting")
            return
        }
        if (currentQuestion.questionType !== "WRITTEN" && currentQuestion.options.length < 2) {
            alert("Kamida 2 ta variant kerak")
            return
        }
        if (currentQuestion.questionType !== "WRITTEN") {
            const hasCorrectAnswer = currentQuestion.options.some(opt => opt.isCorrect)
            if (!hasCorrectAnswer) {
                alert("To'g'ri javob belgiling")
                return
            }
        }

        setQuestions((prev) => [...prev, { ...currentQuestion }])
        
        // Reset form for next question
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
                { answerText: "", imageUrl: "", isCorrect: false },
            ],
        })
    }

    const removeQuestion = (index: number) => {
        setQuestions((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSaveAndBack = () => {
        // Update the stored data with current questions
        const storedData = localStorage.getItem('testTemplateData')
        if (storedData && subjectIndex !== null) {
            try {
                const data = JSON.parse(storedData)
                data.subjectWithQuestions[subjectIndex].questions = questions
                localStorage.setItem('testTemplateData', JSON.stringify(data))
            } catch (error) {
                console.error('Error updating stored data:', error)
            }
        }
        
        // Navigate back to subjects page
        router.push('/admin/test-templates/add/subjects')
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
                    <Button onClick={() => router.refresh()}>Qayta urinish</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg"
                >
                    ☰
                </Button>
            </div>

            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <AdminSidebar currentPage="test-templates" />
            </div>

            {/* Main Content */}
            <div className="lg:ml-64 p-6">
                {/* Enhanced Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="outline" 
                                onClick={() => handleSaveAndBack()}
                                className="bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Ortga
                            </Button>
                            <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    Savollar qo'shish
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {form.subjectName} - {form.subjectRole} fan uchun savollar
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                                <span className="text-sm font-medium text-gray-700">
                                    {questions.length} ta savol
                                </span>
                            </div>
                            <Button 
                                onClick={handleSaveAndBack}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Saqlash va qaytish
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Question Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Plus className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold">Yangi savol #{questions.length + 1}</div>
                                        <div className="text-sm text-gray-600 font-normal">Ma'lumotlarni to'ldiring</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Question Type and Order */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-700">Savol turi</Label>
                                        <Select
                                            value={currentQuestion.questionType}
                                            onValueChange={(v) => setCurrentQuestion({ ...currentQuestion, questionType: v as TestQuestion["questionType"] })}
                                        >
                                            <SelectTrigger className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                                <SelectValue placeholder="Turini tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SINGLE_CHOICE">Bitta javob</SelectItem>
                                                <SelectItem value="MULTIPLE_CHOICE">Bir nechta javob</SelectItem>
                                                <SelectItem value="WRITTEN">Yozma javob</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-700">Tartib raqam *</Label>
                                        <Input 
                                            placeholder="Tartib raqamni kiriting" 
                                            value={currentQuestion.position}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, position: e.target.value })}
                                            className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Question Text */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700">Savol matni *</Label>
                                    <Textarea
                                        value={currentQuestion.questionText}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                                        rows={4}
                                        placeholder="Savol matnini kiriting..."
                                        className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    />
                                </div>

                                {/* Written Answer */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium text-gray-700">Yozma javob (ixtiyoriy)</Label>
                                    <Textarea
                                        value={currentQuestion.writtenAnswer}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, writtenAnswer: e.target.value })}
                                        rows={3}
                                        placeholder="Yozma javob uchun..."
                                        className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    />
                                </div>

                                {/* Media Uploads */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-700">Rasm</Label>
                                        <div className="relative">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const f = e.target.files?.[0]
                                                    if (!f) return
                                                    try {
                                                        const url = await handleImageUpload(f)
                                                        setCurrentQuestion({ ...currentQuestion, imageUrl: url })
                                                    } catch (err) {
                                                        console.error(err)
                                                    }
                                                }}
                                                className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                                            />
                                            {currentQuestion.imageUrl && (
                                                <div className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                                                    ✓ Rasm yuklandi
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-gray-700">YouTube URL</Label>
                                        <Input
                                            value={currentQuestion.youtubeUrl}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, youtubeUrl: e.target.value })}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Options Section */}
                                {currentQuestion.questionType !== "WRITTEN" && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                            <Label className="text-base font-semibold text-gray-800">Variantlar *</Label>
                                            <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full border border-blue-200">
                                                {currentQuestion.questionType === 'SINGLE_CHOICE' ? 'Bitta to\'g\'ri javob tanlang' : 'Ko\'p to\'g\'ri javob tanlash mumkin'}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {currentQuestion.options.map((option, index) => (
                                                <div key={index} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-shadow duration-200">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex items-center mt-2">
                                                            <input
                                                                type={currentQuestion.questionType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                                                name="correctOption"
                                                                checked={option.isCorrect}
                                                                onChange={() => updateCurrentQuestionOption(index, 'isCorrect', !option.isCorrect)}
                                                                className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                            />
                                                        </div>
                                                        
                                                        <div className="flex-1 space-y-3">
                                                            <Input
                                                                placeholder={`Variant ${index + 1} matni`}
                                                                value={option.answerText}
                                                                onChange={(e) => updateCurrentQuestionOption(index, 'answerText', e.target.value)}
                                                                className="text-sm border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <div className="relative">
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
                                                                    className="text-sm cursor-pointer border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                    placeholder="Rasm fayli"
                                                                />
                                                                {option.imageUrl && (
                                                                    <div className="absolute -top-2 -right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                                                                        ✓ Rasm
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => removeOptionRow(index)}
                                                            disabled={currentQuestion.options.length <= 2}
                                                            className="flex-shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={addOptionRow}
                                                disabled={currentQuestion.options.length >= 6}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Variant qo'shish
                                            </Button>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                {currentQuestion.options.length} ta variant
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Add Question Button */}
                                <Button 
                                    onClick={addQuestion} 
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                                    disabled={!currentQuestion.questionText.trim() || !currentQuestion.position}
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    Savolni qo'shish
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Questions List */}
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm sticky top-6">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                                <CardTitle className="flex items-center gap-3 text-gray-800">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold">Qo'shilgan savollar</div>
                                        <div className="text-sm text-gray-600 font-normal">{questions.length} ta savol</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                {questions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 text-sm">Hali savollar qo'shilmagan</p>
                                        <p className="text-gray-400 text-xs mt-1">Chap tomondagi forma orqali qo'shing</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {questions.map((q, qi) => (
                                            <div key={qi} className="p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                {q.questionType}
                                                            </Badge>
                                                            {q.position && (
                                                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                                    #{q.position}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-700 line-clamp-2 font-medium">{q.questionText}</div>
                                                        {q.options.some(opt => opt.isCorrect) && (
                                                            <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                                To'g'ri javob belgilangan
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => removeQuestion(qi)}
                                                        className="flex-shrink-0 ml-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}
        </div>
    )
}

function LoadingFallback() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Ma'lumotlar yuklanmoqda...</p>
            </div>
        </div>
    )
}

export default function AddQuestionsPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <QuestionsPageContent />
        </Suspense>
    )
}
