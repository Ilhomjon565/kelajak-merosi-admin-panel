"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, BookOpen, BarChart3, Settings, LogOut, Menu, X, Plus, Edit, Trash2, Search, Filter, Copy, HelpCircle } from "lucide-react"
import { apiService } from "@/lib/api"
import { AdminSidebar } from "./sidebar"

interface Subject {
  id: string
  name: string
  calculator: boolean
  imageUrl: string
  status: "active" | "inactive"
  color: string
  tests: number
  questions: number
  createdAt: string
}

export function SubjectsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [subjectDetails, setSubjectDetails] = useState<any>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  useEffect(() => {
    fetch('https://api.bir-zum.uz/api/subject/all?page=0&size=100', {
      headers: {
        'Authorization': `Bearer ${apiService.getAccessToken()}`
      }
    })
      .then(response => response.json())
      .then(response => {
        // API response strukturasi: { success, status, data, message, pageableResponse }
        // subjects data array ichida keladi
        if (response.success && response.data) {
          // API dan kelgan ma'lumotlarni component ning Subject interface ga moslashtiramiz
          const transformedSubjects = response.data.map((apiSubject: any) => ({
            id: apiSubject.id.toString(),
            name: apiSubject.name,
            tests: 0, // API da yo'q, default qiymat
            questions: 0, // API da yo'q, default qiymat
            status: "active" as const, // Default holat
            createdAt: new Date().toISOString().split('T')[0], // Bugungi sana
            color: "bg-blue-500", // Default rang
            imageUrl: apiSubject.imageUrl || "" // API dan kelgan imageUrl ni qo'shamiz
          }))
          setSubjects(transformedSubjects)
        } else {
          console.error('API response da xatolik:', response.message)
          setSubjects([])
        }
      })
      .catch(error => {
        console.error('Subjects yuklashda xatolik:', error)
        setSubjects([])
      })
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [newSubject, setNewSubject] = useState({
    name: "",
    calculator: false,
    color: "bg-blue-500",
    imageUrl: ""
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [selectedEditImage, setSelectedEditImage] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const router = useRouter()

  const handleLogout = () => {
    apiService.clearTokens()
    router.push("/admin/login")
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || subject.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('https://api.bir-zum.uz/api/subject/image/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        },
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.data // Rasm URL manzili qaytariladi
      } else {
        throw new Error(result.message || 'Rasm yuklashda xatolik')
      }
    } catch (error) {
      console.error('Rasm yuklashda xatolik:', error)
      throw error
    }
  }

  const handleAddSubject = async () => {
    if (newSubject.name.trim()) {
      try {
        setIsUploading(true)
        
        let imageUrl = newSubject.imageUrl
        
        // Agar rasm tanlangan bo'lsa, uni yuklash
        if (selectedImage) {
          try {
            imageUrl = await handleImageUpload(selectedImage)
          } catch (error) {
            console.error('Rasm yuklashda xatolik:', error)
            // Rasm yuklanmasa ham subject yaratish davom etadi
          }
        }
        
        // API ga yangi subject yuborish
        const response = await fetch('https://api.bir-zum.uz/api/subject/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          },
          body: JSON.stringify({
            name: newSubject.name,
            calculator: newSubject.calculator,
            imageUrl: imageUrl || ""
          })
        })

        const result = await response.json()
        
        if (result.success) {
          // API dan qaytgan ma'lumotlar bilan yangi subject yaratish
          const newSubjectFromAPI: Subject = {
            id: result.data.id.toString(),
            name: newSubject.name,
            calculator: newSubject.calculator,
            imageUrl: imageUrl || "",
            status: "active",
            color: newSubject.color,
            tests: 0,
            questions: 0,
            createdAt: new Date().toISOString().split('T')[0]
          }
          setSubjects([...subjects, newSubjectFromAPI])
          setNewSubject({ name: "", calculator: false, color: "bg-blue-500", imageUrl: "" })
          setSelectedImage(null)
          setIsAddDialogOpen(false)
        } else {
          console.error('Subject yaratishda xatolik:', result.message)
        }
      } catch (error) {
        console.error('Subject yaratishda xatolik:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleEditSubjectUpdate = async () => {
    if (editingSubject && editingSubject.name.trim()) {
      try {
        setIsUploading(true)
        let imageUrl = editingSubject.imageUrl
        
        // Agar yangi rasm tanlangan bo'lsa, uni yuklash
        if (selectedEditImage) {
          try {
            imageUrl = await handleImageUpload(selectedEditImage)
          } catch (error) {
            console.error('Rasm yuklashda xatolik:', error)
            // Rasm yuklanmasa ham subject yangilash davom etadi
          }
        }
        
        // API ga yangilangan subject yuborish (agar API endpoint mavjud bo'lsa)
        // Hozircha faqat local state ni yangilaymiz
        const updatedSubject = { ...editingSubject, imageUrl, calculator: editingSubject.calculator }
        setSubjects(subjects.map(subject =>
          subject.id === editingSubject.id ? updatedSubject : subject
        ))
        setEditingSubject(null)
        setSelectedEditImage(null)
      } catch (error) {
        console.error('Subject yangilashda xatolik:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  // const handleDeleteSubject = async (id: string) => {
  //   try {
  //     const response = await fetch(`https://api.bir-zum.uz/api/subject/delete/${id}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${apiService.getAccessToken()}`
  //       }
  //     })
  //     const result = await response.json()
  //     if (result.success) {
  //       setSubjects(subjects.filter(subject => subject.id !== id))
  //     } else {
  //       console.error('Subject o\'chirishda xatolik:', result.message)
  //     }
  //   } catch (error) {
  //     console.error('Subject o\'chirishda xatolik:', error)
  //   }
  // }



  const handleSubjectClick = async (subject: Subject) => {
    setSelectedSubject(subject)
    setIsLoadingDetails(true)
    
    try {
      // Fetch subject details using the subjectId
      const response = await fetch(`https://api.bir-zum.uz/api/template/all/${subject.id}?page=0&size=10`, {
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSubjectDetails(result.data)
      } else {
        console.error('Subject details yuklashda xatolik:', result.message)
        setSubjectDetails(null)
      }
    } catch (error) {
      console.error('Subject details yuklashda xatolik:', error)
      setSubjectDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeSubjectDetails = () => {
    setSelectedSubject(null)
    setSubjectDetails(null)
  }

  const toggleSubjectStatus = (subjectId: string) => {
    setSubjects(prevSubjects =>
      prevSubjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, status: subject.status === "active" ? "inactive" : "active" }
          : subject
      )
    )
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const response = await fetch(`https://api.bir-zum.uz/api/subject/delete/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiService.getAccessToken()}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setSubjects(prevSubjects => prevSubjects.filter(subject => subject.id !== subjectId))
      } else {
        console.error('Subject o\'chirishda xatolik:', result.message)
      }
    } catch (except) {
      console.error('Subject o\'chirishda xatolik:', except)
    }
  }

  const handleEditSubject = async () => {
    if (editingSubject && editingSubject.name.trim()) {
      try {
        setIsUploading(true)
        
        let imageUrl = editingSubject.imageUrl
        
        // Agar yangi rasm tanlangan bo'lsa, uni yuklash
        if (selectedEditImage) {
          try {
            imageUrl = await handleImageUpload(selectedEditImage)
          } catch (error) {
            console.error('Rasm yuklashda xatolik:', error)
            // Rasm yuklanmasa ham subject yangilash davom etadi
          }
        }
        
        // API ga yangilangan subject yuborish
        const response = await fetch(`https://api.bir-zum.uz/api/subject/update/${editingSubject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiService.getAccessToken()}`
          },
          body: JSON.stringify({
            name: editingSubject.name,
            calculator: editingSubject.calculator,
            imageUrl: imageUrl || ""
          })
        })

        const result = await response.json()
        
        if (result.success) {
          // Local state ni yangilash
          setSubjects(prevSubjects =>
            prevSubjects.map(subject =>
              subject.id === editingSubject.id
                ? { ...editingSubject, imageUrl }
                : subject
            )
          )
          setEditingSubject(null)
          setSelectedEditImage(null)
        } else {
          console.error('Subject yangilashda xatolik:', result.message)
        }
      } catch (error) {
        console.error('Subject yangilashda xatolik:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const colorOptions = [
    { value: "bg-blue-500", label: "Ko'k" },
    { value: "bg-green-500", label: "Yashil" },
    { value: "bg-purple-500", label: "Binafsha" },
    { value: "bg-orange-500", label: "To'q sariq" },
    { value: "bg-red-500", label: "Qizil" },
    { value: "bg-pink-500", label: "Pushti" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
      <AdminSidebar currentPage="subjects" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Fanlar boshqaruvi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">Admin</Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Fan nomi yoki tavsif bo'yicha qidirish..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Holat bo'yicha filtrlash" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha fanlar</SelectItem>
                <SelectItem value="active">Faol fanlar</SelectItem>
                <SelectItem value="inactive">Nofaol fanlar</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi fan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yangi fan qo'shish</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Fan nomi</Label>
                    <Input
                      id="name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="Masalan: Matematika"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="calculator"
                      type="checkbox"
                      checked={newSubject.calculator}
                      onChange={(e) => setNewSubject({ ...newSubject, calculator: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="calculator">Kalkulyator ruxsat berish</Label>
                  </div>
                  <div>
                    <Label htmlFor="imageFile">Rasm fayli</Label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedImage(file)
                          setNewSubject({ ...newSubject, imageUrl: file.name })
                        }
                      }}
                      className="cursor-pointer"
                    />
                    {selectedImage && (
                      <p className="text-sm text-gray-600 mt-1">
                        Tanlangan: {selectedImage.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="imageUrl">Yoki rasm URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={newSubject.imageUrl}
                      onChange={(e) => setNewSubject({ ...newSubject, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Rang</Label>
                    <Select value={newSubject.color} onValueChange={(value) => setNewSubject({ ...newSubject, color: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-4 h-4 rounded ${color.value}`}></div>
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Bekor qilish
                  </Button>
                  <Button 
                    onClick={handleAddSubject} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Yuklanmoqda...
                      </>
                    ) : (
                      'Qo\'shish'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Subjects List */}
          <div className="mb-4 text-sm text-gray-600 text-center">
            <p>Fanga kirish uchun fanni bosing</p>
          </div>
          <div className="grid gap-4">
            {filteredSubjects.map((subject) => (
              <Card 
                key={subject.id} 
                className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSubjectClick(subject)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                                             <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${subject.color}`}>
                         {subject.imageUrl ? (
                           <img src={subject.imageUrl} alt={subject.name} className="w-12 h-12 rounded-lg object-cover" />
                         ) : (
                           <span className="text-white font-bold text-lg">
                             {subject.name.charAt(0)}
                           </span>
                         )}
                       </div>
                                              <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{subject.name}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>{subject.tests} ta test</span>
                            <span>{subject.questions} ta savol</span>
                            <span>Qo'shilgan: {subject.createdAt}</span>
                            {subject.calculator && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600">
                                Kalkulyator
                              </Badge>
                            )}
                          </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={subject.status === "active" ? "default" : "secondary"}
                        className={subject.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {subject.status === "active" ? "Faol" : "Nofaol"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubjectStatus(subject.id);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {subject.status === "active" ? "Nofaol qilish" : "Faol qilish"}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-600 hover:text-gray-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubject(subject);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Fanni tahrirlash</DialogTitle>
                          </DialogHeader>
                          {editingSubject && (
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="edit-name">Fan nomi</Label>
                                <Input
                                  id="edit-name"
                                  value={editingSubject.name}
                                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  id="edit-calculator"
                                  type="checkbox"
                                  checked={editingSubject.calculator}
                                  onChange={(e) => setEditingSubject({ ...editingSubject, calculator: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor="edit-calculator">Kalkulyator ruxsat berish</Label>
                              </div>
                              <div>
                                <Label htmlFor="edit-imageFile">Rasm fayli</Label>
                                <Input
                                  id="edit-imageFile"
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      setSelectedEditImage(file)
                                      setEditingSubject({ ...editingSubject, imageUrl: file.name })
                                    }
                                  }}
                                  className="cursor-pointer"
                                />
                                {selectedEditImage && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Tanlangan: {selectedEditImage.name}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label htmlFor="edit-imageUrl">Yoki rasm URL</Label>
                                <Input
                                  id="edit-imageUrl"
                                  type="url"
                                  value={editingSubject.imageUrl}
                                  onChange={(e) => setEditingSubject({ ...editingSubject, imageUrl: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-color">Rang</Label>
                                <Select
                                  value={editingSubject.color}
                                  onValueChange={(value) => setEditingSubject({ ...editingSubject, color: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorOptions.map((color) => (
                                      <SelectItem key={color.value} value={color.value}>
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-4 h-4 rounded ${color.value}`}></div>
                                          <span>{color.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingSubject(null)}>
                              Bekor qilish
                            </Button>
                            <Button 
                              onClick={handleEditSubject} 
                              className="bg-green-600 hover:bg-green-700"
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Yuklanmoqda...
                                </>
                              ) : (
                                'Saqlash'
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fanni o'chirish</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu fanni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSubject(subject.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              O'chirish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Fanlar topilmadi</h3>
              <p className="mt-1 text-sm text-gray-500">
                Qidiruv natijalariga mos keladigan fanlar yo'q.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Subject Details Modal */}
      <Dialog open={!!selectedSubject} onOpenChange={closeSubjectDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              {selectedSubject && (
                <>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedSubject.color}`}>
                    {selectedSubject.imageUrl ? (
                      <img src={selectedSubject.imageUrl} alt={selectedSubject.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">
                        {selectedSubject.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span>{selectedSubject.name} - Fan ma'lumotlari</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Ma'lumotlar yuklanmoqda...</span>
            </div>
          ) : subjectDetails ? (
            <div className="space-y-6">
              {/* Subject Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fan haqida</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fan nomi:</span>
                      <span className="font-medium">{selectedSubject?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Holat:</span>
                      <Badge variant={selectedSubject?.status === "active" ? "default" : "secondary"}>
                        {selectedSubject?.status === "active" ? "Faol" : "Nofaol"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kalkulyator:</span>
                      <span className="font-medium">
                        {selectedSubject?.calculator ? "Ruxsat berilgan" : "Ruxsat berilmagan"}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Statistika</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Testlar soni:</span>
                      <span className="font-medium">{selectedSubject?.tests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savollar soni:</span>
                      <span className="font-medium">{selectedSubject?.questions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Qo'shilgan sana:</span>
                      <span className="font-medium">{selectedSubject?.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Templates/Content */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Mavjud kontentlar</h4>
                {Array.isArray(subjectDetails) && subjectDetails.length > 0 ? (
                  <div className="grid gap-3">
                    {subjectDetails.map((item: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {item.name || item.title || `Kontent ${index + 1}`}
                            </h5>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.status && (
                              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                                {item.status === "active" ? "Faol" : "Nofaol"}
                              </Badge>
                            )}
                            <Button variant="outline" size="sm">
                              Ko'rish
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p>Bu fanga tegishli kontentlar hali qo'shilmagan</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Ma'lumotlar yuklanmadi yoki xatolik yuz berdi</p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeSubjectDetails}>
              Yopish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
