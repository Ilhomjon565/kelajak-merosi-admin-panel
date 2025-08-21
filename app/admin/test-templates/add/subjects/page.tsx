"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

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

interface SubjectWithQuestions {
    subjectId: string
    subjectRole: "MAIN" | "SECONDARY"
    subjectName: string
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
    const searchParams = useSearchParams()
    
    // Get template data from URL params
    const templateParam = searchParams.get('template')
    const templateData = templateParam ? JSON.parse(decodeURIComponent(templateParam)) : null

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    const [subjects, setSubjects] = useState<Subject[]>([])
    const [subjectWithQuestions, setSubjectWithQuestions] = useState<SubjectWithQuestions[]>([])
    const [currentSubject, setCurrentQuestion] = useState<SubjectWithQuestions>({
        subjectId: "",
        subjectRole: "MAIN",
        subjectName: "",
        questions: []
    })

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "",
        imageUrl: "",
    })

    // Initialize form with template data when it's available
    useEffect(() => {
        if (templateParam && templateData) {
            setForm({
                title: templateData.title || "",
                duration: templateData.duration || "",
                price: templateData.price || "",
                imageUrl: templateData.imageUrl || "",
            })
        }
    }, [templateParam])

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true)
                setError(null)
                const res = await fetch("https://api.kelajakmerosi.uz/api/subject/all?page=0&size=100", {
                    headers: { Authorization: `Bearer ${apiService.getAccessToken()}` },
                })
                const json = await res.json()
                if (json?.success) setSubjects(json.data ?? [])
                else throw new Error("Fanlarni yuklashda xatolik")
            } catch (e: any) {
                setError(e?.message || "Ma'lumotlarni yuklashda xatolik yuz berdi")
            } finally {
                setLoading(false)
            }
        }
        fetchSubjects()
    }, [])

    // Load data from localStorage when returning from questions page
    useEffect(() => {
        const storedData = localStorage.getItem('testTemplateData')
        if (storedData) {
            try {
                const data = JSON.parse(storedData)
                if (data.subjectWithQuestions) {
                    setSubjectWithQuestions(data.subjectWithQuestions)
                    // Only update form if we don't have template data from URL
                    if (!templateData) {
                        setForm({
                            title: data.title,
                            duration: data.duration,
                            price: data.price,
                            imageUrl: data.imageUrl
                        })
                    }
                }
            } catch (error) {
                console.error('Error parsing stored data:', error)
            }
        }
    }, [])

    const addSubject = () => {
        if (!currentSubject.subjectId) {
            alert("Fan tanlang")
            return
        }
        if (!currentSubject.subjectRole) {
            alert("Fan turini tanlang")
            return
        }

        // Check if MAIN role is already taken
        if (currentSubject.subjectRole === "MAIN" && subjectWithQuestions.some(s => s.subjectRole === "MAIN")) {
            alert("MAIN fan allaqachon qo'shilgan")
            return
        }

        const selectedSubject = subjects.find(s => String(s.id) === currentSubject.subjectId)
        if (!selectedSubject) {
            alert("Fan topilmadi")
            return
        }

        setSubjectWithQuestions(prev => [...prev, {
            ...currentSubject,
            subjectName: selectedSubject.name
        }])

        // Reset form for next subject
        const hasMainSubject = subjectWithQuestions.some(s => s.subjectRole === "MAIN") || currentSubject.subjectRole === "MAIN"
        setCurrentQuestion({
            subjectId: "",
            subjectRole: hasMainSubject ? "SECONDARY" : "MAIN",
            subjectName: "",
            questions: []
        })
    }

    const removeSubject = (index: number) => {
        setSubjectWithQuestions(prev => prev.filter((_, i) => i !== index))
    }

    const navigateToQuestions = (subjectIndex: number) => {
        // Store the current state in localStorage
        localStorage.setItem('testTemplateData', JSON.stringify({
            title: form.title,
            duration: form.duration,
            price: form.price,
            imageUrl: form.imageUrl,
            subjectWithQuestions: subjectWithQuestions,
            currentSubjectIndex: subjectIndex
        }))
        
        router.push(`/admin/test-templates/add/questions?subjectIndex=${subjectIndex}`)
    }

    const handleSubmit = async () => {
        if (subjectWithQuestions.length === 0) {
            alert("Kamida bitta fan qo'shish kerak")
            return
        }

        // Check if there's at least one MAIN subject
        const hasMainSubject = subjectWithQuestions.some(s => s.subjectRole === "MAIN")
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
                testSubjectsAndQuestions: subjectWithQuestions.map(subject => ({
                    subjectId: parseInt(subject.subjectId, 10),
                    subjectRole: subject.subjectRole,
                    testQuestions: subject.questions.map(q => ({
                        ...q,
                        questionType: q.questionType === "WRITTEN" ? "WRITTEN_ANSWER" : q.questionType,
                    }))
                }))
            }

            const res = await fetch("https://api.kelajakmerosi.uz/api/template/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiService.getAccessToken()}`,
                },
                body: JSON.stringify(payload),
            })

            const json = await res.json()
            if (json?.success) {
                alert("Test shabloni muvaffaqiyatli yaratildi!")
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
                        <Button variant="outline" onClick={() => router.push("/admin/test-templates/add")}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Ortga
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Fanlar va savollar</h1>
                            <p className="text-gray-600">Test shabloniga fanlar va savollar qo'shing</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-sm">
                            {subjectWithQuestions.length} ta fan
                        </Badge>
                        <Button onClick={handleSubmit} disabled={saving || subjectWithQuestions.length === 0}>
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
                                    Yangi fan #{subjectWithQuestions.length + 1}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Subject Selection */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Fan tanlang *</Label>
                                        <Select
                                            value={currentSubject.subjectId}
                                            onValueChange={(v) => setCurrentQuestion({ ...currentSubject, subjectId: v })}
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
                                            value={currentSubject.subjectRole}
                                            onValueChange={(v) => setCurrentQuestion({ ...currentSubject, subjectRole: v as "MAIN" | "SECONDARY" })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Turini tanlang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MAIN" disabled={subjectWithQuestions.some(s => s.subjectRole === "MAIN")}>
                                                    MAIN {subjectWithQuestions.some(s => s.subjectRole === "MAIN") ? "(mavjud)" : ""}
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
                                    disabled={!currentSubject.subjectId}
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
                                    Qo'shilgan fanlar ({subjectWithQuestions.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {subjectWithQuestions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        Hali fanlar qo'shilmagan
                                    </div>
                                ) : (
                                    subjectWithQuestions.map((subject, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1 flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant={subject.subjectRole === "MAIN" ? "default" : "secondary"} className="text-xs">
                                                            {subject.subjectRole}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {subject.questions.length} ta savol
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-700">{subject.subjectName}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => navigateToQuestions(index)}
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

export default function SubjectsPage() {
    return (
        <Suspense fallback={<SubjectsPageLoading />}>
            <SubjectsPageContent />
        </Suspense>
    )
}
