"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft, Save } from "lucide-react"

import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

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
    const [questions, setQuestions] = useState<any[]>([])
    const [showQuestions, setShowQuestions] = useState(false)

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "",
        imageUrl: "",
    })

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
                    
                    setQuestions(fetchedQuestions)
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
            const payload = {
                title: form.title,
                duration: parseInt(form.duration, 10),
                price: parseInt(form.price, 10) || 0,
                testSubjectsAndQuestions: [
                    {
                        subjectId: 1, // Default subject ID
                        subjectRole: "MAIN",
                        testQuestions: questions
                    }
                ]
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
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.push("/admin/test-templates")}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Ortga
                        </Button>
                        <h1 className="text-2xl font-bold">Test Shablonini Tahrirlash</h1>
                    </div>
                    <div />
                </div>

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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Savollar ({questions?.length || 0})</span>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowQuestions(!showQuestions)}
                            >
                                {showQuestions ? "Yashirish" : "Ko'rsatish"}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!showQuestions ? (
                            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                <p className="text-gray-500 mb-4">Savollarni ko'rish va tahrirlash uchun tugmani bosing</p>
                                <Button 
                                    onClick={() => setShowQuestions(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Savollarni ko'rsatish
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.isArray(questions) && questions.length > 0 ? (
                                    questions.map((question: any, qIndex: number) => (
                                        <div key={qIndex} className="p-4 border rounded-lg bg-white">
                                            <div className="mb-3">
                                                <h4 className="font-medium text-gray-900 mb-2">
                                                    Savol #{qIndex + 1}
                                                </h4>
                                            </div>
                                            
                                            {/* Question Text */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium mb-1">Savol matni</label>
                                                <input
                                                    type="text"
                                                    value={question.questionText || ""}
                                                    onChange={(e) => {
                                                        const newQuestions = [...questions]
                                                        newQuestions[qIndex] = {
                                                            ...newQuestions[qIndex],
                                                            questionText: e.target.value
                                                        }
                                                        setQuestions(newQuestions)
                                                    }}
                                                    placeholder="Savol matnini kiriting"
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                            </div>

                                            {/* Question Type */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium mb-1">Savol turi</label>
                                                <select
                                                    value={question.questionType || "SINGLE_CHOICE"}
                                                    onChange={(e) => {
                                                        const newQuestions = [...questions]
                                                        newQuestions[qIndex] = {
                                                            ...newQuestions[qIndex],
                                                            questionType: e.target.value
                                                        }
                                                        setQuestions(newQuestions)
                                                    }}
                                                    className="w-full p-2 border rounded text-sm"
                                                >
                                                    <option value="SINGLE_CHOICE">SINGLE_CHOICE</option>
                                                    <option value="MULTIPLE_CHOICE">MULTIPLE_CHOICE</option>
                                                    <option value="WRITTEN_ANSWER">WRITTEN_ANSWER</option>
                                                </select>
                                            </div>

                                            {/* Written Answer */}
                                            {question.questionType === "WRITTEN_ANSWER" && (
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium mb-1">Javob matni</label>
                                                    <input
                                                        type="text"
                                                        value={question.writtenAnswer || ""}
                                                        onChange={(e) => {
                                                            const newQuestions = [...questions]
                                                            newQuestions[qIndex] = {
                                                                ...newQuestions[qIndex],
                                                                writtenAnswer: e.target.value
                                                            }
                                                            setQuestions(newQuestions)
                                                        }}
                                                        placeholder="Javob matnini kiriting"
                                                        className="w-full p-2 border rounded text-sm"
                                                    />
                                                </div>
                                            )}

                                            {/* Options */}
                                            {(question.questionType === "SINGLE_CHOICE" || question.questionType === "MULTIPLE_CHOICE") && (
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium mb-1">Variantlar</label>
                                                    <div className="space-y-2">
                                                        {(question.testAnswerOptions || []).map((option: any, optIndex: number) => (
                                                            <div key={optIndex} className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={option.answerText || ""}
                                                                    onChange={(e) => {
                                                                        const newQuestions = [...questions]
                                                                        newQuestions[qIndex].testAnswerOptions[optIndex] = {
                                                                            ...newQuestions[qIndex].testAnswerOptions[optIndex],
                                                                            answerText: e.target.value
                                                                        }
                                                                        setQuestions(newQuestions)
                                                                    }}
                                                                    placeholder={`Variant ${optIndex + 1}`}
                                                                    className="flex-1 p-2 border rounded text-sm"
                                                                />
                                                                <input
                                                                    type="checkbox"
                                                                    checked={option.isCorrect || false}
                                                                    onChange={(e) => {
                                                                        const newQuestions = [...questions]
                                                                        newQuestions[qIndex].testAnswerOptions[optIndex] = {
                                                                            ...newQuestions[qIndex].testAnswerOptions[optIndex],
                                                                            isCorrect: e.target.checked
                                                                        }
                                                                        setQuestions(newQuestions)
                                                                    }}
                                                                    className="h-4 w-4"
                                                                />
                                                                <span className="text-xs text-gray-500">To'g'ri</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Image URL */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium mb-1">Rasm URL</label>
                                                <input
                                                    type="text"
                                                    value={question.imageUrl || ""}
                                                    onChange={(e) => {
                                                        const newQuestions = [...questions]
                                                        newQuestions[qIndex] = {
                                                            ...newQuestions[qIndex],
                                                            imageUrl: e.target.value
                                                        }
                                                        setQuestions(newQuestions)
                                                    }}
                                                    placeholder="Rasm URL manzili"
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                            </div>

                                            {/* YouTube URL */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium mb-1">YouTube URL</label>
                                                <input
                                                    type="text"
                                                    value={question.youtubeUrl || ""}
                                                    onChange={(e) => {
                                                        const newQuestions = [...questions]
                                                        newQuestions[qIndex] = {
                                                            ...newQuestions[qIndex],
                                                            youtubeUrl: e.target.value
                                                        }
                                                        setQuestions(newQuestions)
                                                    }}
                                                    placeholder="YouTube video URL"
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                            </div>

                                            {/* Position */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium mb-1">Pozitsiya</label>
                                                <input
                                                    type="text"
                                                    value={question.position || ""}
                                                    onChange={(e) => {
                                                        const newQuestions = [...questions]
                                                        newQuestions[qIndex] = {
                                                            ...newQuestions[qIndex],
                                                            position: e.target.value
                                                        }
                                                        setQuestions(newQuestions)
                                                    }}
                                                    placeholder="Savol pozitsiyasi"
                                                    className="w-full p-2 border rounded text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        Savollar topilmadi
                                    </div>
                                )}
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
