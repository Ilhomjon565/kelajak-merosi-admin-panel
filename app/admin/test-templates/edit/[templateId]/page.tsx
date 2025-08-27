"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useParams } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft, Loader2 } from "lucide-react"

import { apiService } from "@/lib/api"
import { AdminSidebar } from "@/components/admin/sidebar"

interface TestTemplateForm {
    title: string
    duration: string
    price: string
    imageUrl: string
}

function EditTestTemplatePageContent() {
    const router = useRouter()
    const params = useParams()
    const templateId = params.templateId as string

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState<TestTemplateForm>({
        title: "",
        duration: "",
        price: "",
        imageUrl: "",
    })



    const [selectedImage, setSelectedImage] = useState<File | null>(null)

    useEffect(() => {
        fetchTemplateData()
    }, [templateId])



    // Clear localStorage when component unmounts
    useEffect(() => {
        return () => {
            // Only clear if there was an error
            if (error) {
                localStorage.removeItem(`editTestTemplateData_${templateId}`)
            }
        }
    }, [error, templateId])

    const fetchTemplateData = async () => {
        try {
            setLoading(true)
            setError(null)
            
            const response = await fetch(`https://api.kelajakmerosi.uz/api/template/getWithoutQuestions/${templateId}`, {
                headers: { 
                    Authorization: `Bearer ${apiService.getAccessToken()}` 
                }
            })
            
            const result = await response.json()
            
            if (result.success) {
                const template = result.data
                const newForm = {
                    title: template.title || "",
                    duration: template.duration?.toString() || "",
                    price: template.price?.toString() || "0",
                    imageUrl: template.imageUrl || "",
                }
                setForm(newForm)
                
                // Save initial form data to localStorage
                localStorage.setItem(`editTestTemplateData_${templateId}`, JSON.stringify({
                    ...newForm,
                    subjectWithQuestions: []
                }))
            } else {
                setError(result.message || "Test shablonini yuklashda xatolik")
            }
        } catch (err) {
            setError("Ma'lumotlarni yuklashda xatolik yuz berdi")
            console.error("Error fetching template:", err)
        } finally {
            setLoading(false)
        }
    }

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

        alert("Avval savollar qo'shish kerak!")
        return
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto" />
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
                <div className="mb-6 flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            // Clear localStorage when going back
                            localStorage.removeItem(`editTestTemplateData_${templateId}`)
                            router.push("/admin/test-templates")
                        }}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Orqaga
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Test shablonini tahrirlash</h1>
                        <p className="text-gray-600">Mavjud test shablonini o'zgartiring</p>
                    </div>
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
                                {form.imageUrl && !selectedImage && (
                                    <p className="text-xs text-blue-600">Mavjud rasm: {form.imageUrl}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-4" />

                <Card>
                    <CardHeader>
                        <CardTitle>Savollar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <p className="text-gray-500 mb-4">Savollarni tahrirlash uchun tugmani bosing</p>
                            <Button 
                                onClick={() => {
                                    if (!form.title.trim()) {
                                        alert("Test nomini kiriting")
                                        return
                                    }
                                    if (!form.duration || parseInt(form.duration) <= 0) {
                                        alert("Vaqtni to'g'ri kiriting")
                                        return
                                    }

                                    const templateData = {
                                        title: form.title,
                                        duration: form.duration,
                                        price: form.price,
                                        imageUrl: form.imageUrl,
                                    }
                                    const encodedData = encodeURIComponent(JSON.stringify(templateData))
                                    router.push(`/admin/test-templates/edit/${templateId}/subjects?template=${encodedData}`)
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Fanlar va savollarni tahrirlash
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="h-6" />

                <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => {
                        // Clear localStorage when canceling
                        localStorage.removeItem(`editTestTemplateData_${templateId}`)
                        router.push("/admin/test-templates")
                    }}>
                        Bekor qilish
                    </Button>
                    <Button onClick={handleSubmit}>Saqlash</Button>
                </div>
            </div>

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
                <Loader2 className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto" />
                <p className="mt-4 text-gray-600">Sahifa yuklanmoqda...</p>
            </div>
        </div>
    )
}

export default function EditTestTemplatePage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <EditTestTemplatePageContent />
        </Suspense>
    )
}
