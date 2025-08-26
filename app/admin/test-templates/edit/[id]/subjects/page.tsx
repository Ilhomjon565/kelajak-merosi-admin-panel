"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeft, Trash2, Save, CheckCircle, BookOpen } from "lucide-react"

import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

interface Subject {
    id: number
    name: string
    calculator: boolean
    imageUrl: string
}

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

function SubjectsPageContent() {
    const router = useRouter()
    const params = useParams()
    const templateId = params.id as string

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [subjects, setSubjects] = useState<Subject[]>([])
    const [subjectsWithQuestions, setSubjectsWithQuestions] = useState<SubjectWithQuestions[]>([])
    const [currentSubject, setCurrentSubject] = useState<SubjectWithQuestions>({
        subject: { id: 0, name: "", calculator: false, imageUrl: "" },
        role: "MAIN",
        questions: []
    })

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "",
        imageUrl: "",
    })

    useEffect(() => {
        const fetchData = async () => {
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

                // Fetch available subjects
                const subjectsRes = await fetch("https://api.kelajakmerosi.uz/api/subject/all?page=0&size=100", {
                    headers: { Authorization: `Bearer ${apiService.getAccessToken()}` },
                })
                const subjectsJson = await subjectsRes.json()
                if (subjectsJson?.success) setSubjects(subjectsJson.data ?? [])
                else throw new Error("Fanlarni yuklashda xatolik")
                
            } catch (err: any) {
                setError(err?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi")
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }

        if (templateId) {
            fetchData()
        }
    }, [templateId])

    const addSubject = () => {
        if (!currentSubject.subject.id) {
            alert("Fan tanlang")
            return
        }
        if (!currentSubject.role) {
            alert("Fan turini tanlang")
            return
        }

        // Check if MAIN role is already taken
        if (currentSubject.role === "MAIN" && subjectsWithQuestions.some(s => s.role === "MAIN")) {
            alert("MAIN fan allaqachon qo'shilgan")
            return
        }

        const selectedSubject = subjects.find(s => s.id === currentSubject.subject.id)
        if (!selectedSubject) {
            alert("Fan topilmadi")
            return
        }

        setSubjectsWithQuestions(prev => [...prev, {
            ...currentSubject,
            subject: selectedSubject
        }])

        // Reset form for next subject
        const hasMainSubject = subjectsWithQuestions.some(s => s.role === "MAIN") || currentSubject.role === "MAIN"
        setCurrentSubject({
            subject: { id: 0, name: "", calculator: false, imageUrl: "" },
            role: hasMainSubject ? "SECONDARY" : "MAIN",
            questions: []
        })
    }

    const removeSubject = (index: number) => {
        setSubjectsWithQuestions(prev => prev.filter((_, i) => i !== index))
    }

    const navigateToQuestions = (subjectIndex: number) => {
        // Store the current state in localStorage
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

    const handleSubmit = async () => {
        if (subjectsWithQuestions.length === 0) {
            alert("Kamida bitta fan qo'shish kerak")
            return
        }

        // Check if there's at least one MAIN subject
        const hasMainSubject = subjectsWithQuestions.some(s => s.role === "MAIN")
        if (!hasMainSubject) {
            alert("Kamida bitta MAIN fan bo'lishi kerak")
            return
        }

        setSaving(true)
        try {
            const payload = {
                title: form.title,
                duration: parseInt(form.duration, 10),
                price: parseInt(form.price, 10) || 0,
                testSubjectsAndQuestions: subjectsWithQuestions.map(subject => ({
                    subjectId: subject.subject.id,
                    subjectRole: subject.role,
                    testQuestions: subject.questions.map(q => ({
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

            const res = await fetch(`https://api.kelajakmerosi.uz/api/template/update/${templateId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiService.getAccessToken()}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json()
            if (json?.success) {
                alert("Test shabloni muvaffaqiyatli yangilandi!")
                router.push("/admin/test-templates")
            } else {
                alert(json?.message || "Xatolik yuz berdi")
            }
        } catch (error) {
            alert("Server bilan bog'lanishda xatolik")
        } finally {
            setSaving(false)
        }
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
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.push(`/admin/test-templates/edit/${templateId}`)}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Ortga
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Fanlar va savollar</h1>
                            <p className="text-gray-600">Test shabloniga fanlar va savollar qo'shing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                            {subjectsWithQuestions.length} ta fan
                        </Badge>
                        <Button onClick={handleSubmit} disabled={saving || subjectsWithQuestions.length === 0}>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Subject Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="h-5 w-5" />
                                    Yangi fan #{subjectsWithQuestions.length + 1}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Subject Selection */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fan tanlang *</Label>
                                        <Select
                                            value={currentSubject.subject.id ? String(currentSubject.subject.id) : ""}
                                            onValueChange={(v) => setCurrentSubject({ ...currentSubject, subject: { ...currentSubject.subject, id: parseInt(v) } })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Fan tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects.map((subject) => (
                                                    <SelectItem key={subject.id} value={String(subject.id)}>
                                                        {subject.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Fan turi *</Label>
                                        <Select
                                            value={currentSubject.role}
                                            onValueChange={(v) => setCurrentSubject({ ...currentSubject, role: v as "MAIN" | "SECONDARY" })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Turini tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MAIN" disabled={subjectsWithQuestions.some(s => s.role === "MAIN")}>
                                                    MAIN {subjectsWithQuestions.some(s => s.role === "MAIN") ? "(mavjud)" : ""}
                                                </SelectItem>
                                                <SelectItem value="SECONDARY">SECONDARY</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Add Subject Button */}
                                <Button 
                                    onClick={addSubject} 
                                    className="w-full"
                                    disabled={!currentSubject.subject.id}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Fanni qo'shish
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Subjects List */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5" />
                                    Qo'shilgan fanlar ({subjectsWithQuestions.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {subjectsWithQuestions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Hali fanlar qo'shilmagan
                                    </div>
                                ) : (
                                    subjectsWithQuestions.map((subject, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={subject.role === "MAIN" ? "default" : "secondary"} className="text-xs">
                                                            {subject.role}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {subject.questions.length} ta savol
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700">{subject.subject.name}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => navigateToQuestions(subject.subject.id)}
                                                    >
                                                        <BookOpen className="h-3 w-3" />
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        onClick={() => removeSubject(index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}
        </div>
    )
}

// Loading fallback component
function SubjectsPageLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Sahifa yuklanmoqda...</p>
            </div>
        </div>
    )
}

export default function EditSubjectsPage() {
    return (
        <Suspense fallback={<SubjectsPageLoading />}>
            <SubjectsPageContent />
        </Suspense>
    )
}
