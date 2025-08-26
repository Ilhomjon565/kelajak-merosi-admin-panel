"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft, Save, BookOpen, Trash2 } from "lucide-react"

import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

interface TestQuestionOption {
    id?: number
    questionId?: number
    answerText: string
    imageUrl: string
    isCorrect: boolean
}

interface TestQuestion {
    id?: number
    testSubjectId?: number
    questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "WRITTEN_ANSWER"
    writtenAnswer: string
    questionText: string
    imageUrl: string
    youtubeUrl: string
    position: string
    testAnswerOptions: TestQuestionOption[]
}

interface Subject {
    id: number
    name: string
    calculator: boolean
    imageUrl: string
}

interface SubjectWithQuestions {
    subject: Subject
    role: "MAIN" | "SECONDARY"
    questions: TestQuestion[]
}

interface TestTemplateForm {
    title: string
    duration: string
    price: string
    imageUrl: string
}

export default function EditTestTemplatePage() {
    const router = useRouter()
    const params = useParams()
    const templateId = params.id as string

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "",
        imageUrl: "",
    })

    const [subjectsWithQuestions, setSubjectsWithQuestions] = useState<SubjectWithQuestions[]>([])
    const [selectedImage, setSelectedImage] = useState<File | null>(null)

    useEffect(() => {
        const fetchTemplate = async () => {
            try {
                setLoading(true)
                setError(null)
                
                // Fetch template data
                const response = await fetch(`https://api.kelajakmerosi.uz/api/template/getWithQuestions/${templateId}`, {
                    headers: {
                        'Authorization': `Bearer ${apiService.getAccessToken()}`
                    }
                })
                
                const result = await response.json()
                
                if (result.success) {
                    const templateData = result.data.testTemplate
                    const fetchedQuestions = result.data.questions || []
                    
                    setForm({
                        title: templateData.title || "",
                        duration: templateData.duration?.toString() || "",
                        price: templateData.price?.toString() || "0",
                        imageUrl: templateData.imageUrl || "",
                    })
                    
                    // Organize questions by subjects
                    const subjectsMap = new Map<number, SubjectWithQuestions>()
                    
                    // Initialize subjects from template
                    templateData.subjects?.forEach((subjectData: any) => {
                        subjectsMap.set(subjectData.subject.id, {
                            subject: subjectData.subject,
                            role: subjectData.role,
                            questions: []
                        })
                    })
                    
                    // Assign questions to their subjects by matching testSubjectId with subject.id
                    fetchedQuestions.forEach((question: any) => {
                        const subjectId = question.testSubjectId
                        if (subjectsMap.has(subjectId)) {
                            const subjectData = subjectsMap.get(subjectId)!
                            subjectData.questions.push(question)
                        }
                    })
                    
                    // Convert map to array and sort questions by position
                    const subjectsArray = Array.from(subjectsMap.values())
                    subjectsArray.forEach(subject => {
                        subject.questions.sort((a, b) => {
                            const posA = parseInt(a.position) || 0
                            const posB = parseInt(b.position) || 0
                            return posA - posB
                        })
                    })
                    
                    setSubjectsWithQuestions(subjectsArray)
                } else {
                    setError("Test shablonini yuklashda xatolik yuz berdi")
                }
            } catch (err) {
                setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
                console.error("Error fetching template:", err)
            } finally {
                setLoading(false)
            }
        }

        if (templateId) {
            fetchTemplate()
        }
    }, [templateId])

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

    const handleSubmit = async () => {
        // Validation
        if (!form.title.trim()) {
            alert("Test nomini kiriting")
            return
        }
        if (!form.duration || parseInt(form.duration) <= 0) {
            alert("Vaqtni to'g'ri kiriting")
            return
        }

        setSaving(true)
        try {
            // Transform data to match API schema
            const payload = {
                title: form.title,
                duration: parseInt(form.duration, 10),
                price: parseInt(form.price, 10) || 0,
                testSubjectsAndQuestions: subjectsWithQuestions?.map(subjectData => ({
                    subjectId: subjectData.subject.id,
                    subjectRole: subjectData.role,
                    testQuestions: subjectData.questions?.map(q => ({
                        questionType: q.questionType,
                        questionText: q.questionText,
                        writtenAnswer: q.writtenAnswer,
                        imageUrl: q.imageUrl,
                        youtubeUrl: q.youtubeUrl,
                        position: q.position,
                        options: q.testAnswerOptions.map(option => ({
                            answerText: option.answerText,
                            imageUrl: option.imageUrl,
                            isCorrect: option.isCorrect
                        }))
                    }))
                }))
            }

            console.log("Sending payload:", payload)

            const res = await fetch(`https://api.kelajakmerosi.uz/api/template/update/${templateId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiService.getAccessToken()}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json()
            console.log("API response:", json)
            
            if (json?.success) {
                alert("Test shabloni muvaffaqiyatli yangilandi!")
                router.push("/admin/test-templates")
            } else {
                alert(json?.message || "Xatolik yuz berdi")
            }
        } catch (error) {
            console.error("Error updating template:", error)
            alert("Server bilan bog'lanishda xatolik")
        } finally {
            setSaving(false)
        }
    }

    const navigateToQuestions = (subjectIndex: number) => {
        // Store the current state in localStorage for editing questions
        console.log(subjectIndex)
            localStorage.setItem('editTestTemplateData', JSON.stringify({
                templateId: templateId,
                title: form.title,
                duration: form.duration,
                price: form.price,
                imageUrl: form.imageUrl,
                subjectsWithQuestions: subjectsWithQuestions,
                currentSubjectIndex: subjectIndex
            }))
        router.push(`/admin/test-templates/edit/${templateId}/questions?subjectIndex=${subjectIndex}`)
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
        <div className="min-h-screen bg-gray-50">
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    ☰
                </Button>
            </div>

            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <AdminSidebar currentPage="test-templates" />
            </div>

            <div className="lg:ml-64 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.push("/admin/test-templates")}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Ortga
                        </Button>
                        <h1 className="text-2xl font-bold">Test Shablonini Tahrirlash</h1>
                    </div>
                    <div />
                </div>

                {/* Basic Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Asosiy ma'lumotlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Nomi</Label>
                                <Input 
                                    id="title" 
                                    value={form.title} 
                                    onChange={(e) => setForm({ ...form, title: e.target.value })} 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Vaqt (min)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Narx</Label>
                                <Input 
                                    id="price" 
                                    type="number" 
                                    value={form.price} 
                                    onChange={(e) => setForm({ ...form, price: e.target.value })} 
                                />
                            </div>

                            <div className="space-y-2 lg:col-span-2">
                                <Label htmlFor="image">Rasm</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const f = e.target.files?.[0]
                                        if (!f) return
                                        setSelectedImage(f)
                                        try {
                                            const url = await handleImageUpload(f)
                                            setForm((prev) => ({ ...prev, imageUrl: url }))
                                        } catch (err) {
                                            console.error(err)
                                        }
                                    }}
                                />
                                {selectedImage && form.imageUrl && (
                                    <p className="text-xs text-green-600">Rasm yuklandi: {form.imageUrl}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-4" />

                {/* Subjects and Questions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Fanlar va savollar ({subjectsWithQuestions.length} ta fan)</span>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/admin/test-templates/edit/${templateId}/subjects`)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Fanlarni boshqarish
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {subjectsWithQuestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <BookOpen className="h-8 w-8 text-gray-400" />
                                    </div>
                                </div>
                                <p className="text-lg font-medium mb-2">Fanlar topilmadi</p>
                                <p className="text-sm text-gray-500 mb-4">
                                    Test shabloniga fanlar va savollar qo'shish uchun "Fanlarni boshqarish" tugmasini bosing.
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={() => router.push(`/admin/test-templates/edit/${templateId}/subjects`)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Fanlarni qo'shish
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {subjectsWithQuestions?.map((subjectData,) => (
                                    <div key={subjectData.subject.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        subjectData.role === "MAIN" 
                                                            ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                                            : "bg-gray-100 text-gray-800 border border-gray-200"
                                                    }`}>
                                                        {subjectData.role}
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        {subjectData.subject.name}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {subjectData.questions.length} ta savol
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => navigateToQuestions(subjectData.subject.id)}
                                                    className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800"
                                                >
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    Savollarni tahrirlash
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {/* Questions Preview */}
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {subjectData.questions.length > 0 ? (
                                                <>
                                                    {subjectData.questions.slice(0, 5).map((question, qIndex) => (
                                                        <div key={qIndex} className="p-2 bg-white rounded border text-sm hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                    #{question.position}
                                                                </span>
                                                                <span className="text-xs px-2 py-1 bg-gray-100 rounded border">
                                                                    {question.questionType}
                                                                </span>
                                                                {question.testAnswerOptions?.length > 0 && (
                                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                                                        {question.testAnswerOptions.length} ta variant
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-gray-700 line-clamp-2 font-medium">
                                                                {question.questionText || "Rasmli savol"}
                                                            </div>
                                                            <div className="flex gap-2 mt-1">
                                                                {question.imageUrl && (
                                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                                        📷 Rasm
                                                                    </span>
                                                                )}
                                                                {question.youtubeUrl && (
                                                                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                                                                        🎥 Video
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {subjectData.questions.length > 5 && (
                                                        <div className="text-center text-xs text-gray-500 py-2 bg-white rounded border">
                                                            ... va {subjectData.questions.length - 5} ta boshqa savol
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500 text-sm bg-white rounded border">
                                                    Bu fanga hali savollar qo'shilmagan
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="h-6" />

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => router.push("/admin/test-templates")}>
                        Bekor qilish
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saqlanmoqda...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Saqlash
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}
        </div>
    )
}
