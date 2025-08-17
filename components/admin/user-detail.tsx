"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Shield, Lock, Unlock, Users, Calendar, Phone, Trash2, Clock } from "lucide-react"
import { apiService, TestTemplate } from "@/lib/api"
import { AdminSidebar } from "./sidebar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface User {
  id: string
  name: string
  phone: string
  hasTestAccess: boolean
  testAccessTemplate?: string
}

interface TestAccessRecord {
  id: number
  testTemplate: string
  grantedAt: string
}

export function UserDetail() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>([])
  const [testAccessRecords, setTestAccessRecords] = useState<TestAccessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  useEffect(() => {
    if (userId) {
      loadUserData()
      loadTestTemplates()
    }
  }, [userId])

  const loadUserData = async () => {
    try {
      // User access ma'lumotlarini olish
      const accessResponse = await apiService.getUserAccess(userId)
      console.log('User access response:', accessResponse)
      
      if (accessResponse.success && accessResponse.data && accessResponse.data.length > 0) {
        // API response structure: data[0].testTemplates array
        const userAccessData = accessResponse.data[0]
        const userData = userAccessData.user
        const testTemplatesData = userAccessData.testTemplates || []
        
        // Test access record'larni saqlash
        const accessRecords: TestAccessRecord[] = testTemplatesData.map((access: any) => ({
          id: access.id,
          testTemplate: access.testTemplate,
          grantedAt: access.grantedAt
        }))
        setTestAccessRecords(accessRecords)
        
        setUser({
          id: userData.id.toString(),
          name: userData.fullName,
          phone: userData.phoneNumber,
          hasTestAccess: accessRecords.length > 0,
          testAccessTemplate: accessRecords.length > 0 ? accessRecords[0].testTemplate : undefined
        })
      } else {
        // User access yo'q bo'lsa, oddiy user ma'lumotlarini olish
        const usersResponse = await apiService.getUsers()
        const userData = usersResponse.data.find(u => u.userId.toString() === userId)
        
        if (userData) {
          setUser({
            id: userData.userId.toString(),
            name: userData.fullName,
            phone: userData.phoneNumber,
            hasTestAccess: false,
            testAccessTemplate: undefined
          })
        }
        setTestAccessRecords([])
      }
    } catch (error) {
      console.error('User ma\'lumotlarini yuklashda xatolik:', error)
      
      // Fallback: oddiy user ma'lumotlarini olish
      try {
        const usersResponse = await apiService.getUsers()
        const userData = usersResponse.data.find(u => u.userId.toString() === userId)
        
        if (userData) {
          setUser({
            id: userData.userId.toString(),
            name: userData.fullName,
            phone: userData.phoneNumber,
            hasTestAccess: false,
            testAccessTemplate: undefined
          })
        }
        setTestAccessRecords([])
      } catch (fallbackError) {
        console.error('Fallback user ma\'lumotlarini yuklashda xatolik:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTestTemplates = async () => {
    try {
      const response = await apiService.getTestTemplates()
      setTestTemplates(response.data)
    } catch (error) {
      console.error('Test template\'larni yuklashda xatolik:', error)
      // Fallback templates
      setTestTemplates([])
    }
  }

  const grantTestAccess = async (templateId: string) => {
    if (!user) return
    
    setUpdating(true)
    try {
      console.log('Granting access for user:', user.id, 'template:', templateId)
      const response = await apiService.grantTestAccess(user.id, templateId)
      console.log('Grant response:', response)
      
      if (response.success) {
        setUser(prev => prev ? {
          ...prev,
          hasTestAccess: true,
          testAccessTemplate: templateId
        } : null)
        console.log('Test ruxsati muvaffaqiyatli berildi')
        
        // User data'ni qayta yuklash
        await loadUserData()
      }
    } catch (error) {
      console.error('Test ruxsati berishda xatolik:', error)
    } finally {
      setUpdating(false)
    }
  }

  const removeTestAccess = async (accessId: number) => {
    if (!user) return
    
    setUpdating(true)
    try {
      console.log('Removing access record with ID:', accessId)
      // API'da access record'ni ID bilan o'chirish kerak
      // Lekin hozircha templateId bilan ishlaymiz, chunki API endpoint templateId ni kutmoqda
      // API response'dan templateId ni topamiz
      const accessRecord = testAccessRecords.find(record => record.id === accessId)
      if (!accessRecord) {
        console.error('Access record topilmadi')
        return
      }
      
      const response = await apiService.revokeTestAccessById(accessId)
      console.log('Remove response:', response)
      
      if (response.success) {
        console.log('Test ruxsati muvaffaqiyatli olib tashlandi')
        
        // User data'ni qayta yuklash
        await loadUserData()
      }
    } catch (error) {
      console.error('Test ruxsatini olib tashlashda xatolik:', error)
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Foydalanuvchi topilmadi</h3>
            <Button 
              onClick={() => router.push('/admin/users')}
              className="mt-4"
            >
              Orqaga qaytish
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar currentPage="users" />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Users className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/admin/users')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Foydalanuvchi ma'lumotlari</h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* User Info Card */}
          <Card className="bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-2xl font-bold">{user.name}</div>
                  <div className="text-sm text-gray-500">ID: {user.id}</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Telefon raqami</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Test ruxsati</p>
                    <Badge className={user.hasTestAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {user.hasTestAccess ? (
                        <>
                          <Unlock className="w-3 h-3 mr-1" />
                          Ruxsat berilgan ({testAccessRecords.length})
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Ruxsat yo'q
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Access Records */}
          <Card className="bg-white shadow-sm mb-6">
            <CardHeader>
              <CardTitle>Test ruxsati tarixi</CardTitle>
              <CardDescription>
                {user.name} uchun berilgan barcha test ruxsatlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testAccessRecords.length > 0 ? (
                <div className="space-y-3">
                  {testAccessRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{record.testTemplate}</h4>
                          <p className="text-sm text-gray-500">
                            Berilgan vaqti: {formatDate(record.grantedAt)}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-200"
                            disabled={updating}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            O'chirish
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Test ruxsatini olib tashlash</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{record.testTemplate}" test ruxsatini olib tashlashni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                                          <AlertDialogAction 
                                onClick={() => removeTestAccess(record.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={updating}
                              >
                              O'chirish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <h4 className="font-medium text-gray-800">Test ruxsati yo'q</h4>
                  <p className="text-gray-600">Foydalanuvchiga hali test ruxsati berilmagan</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grant New Test Access */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Yangi test ruxsati berish</CardTitle>
              <CardDescription>
                {user.name} uchun yangi test template ruxsati berish
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {testTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    onClick={() => grantTestAccess(template.id)}
                    disabled={updating}
                    className="justify-start h-auto p-3 hover:bg-green-50 hover:border-green-200"
                  >
                    <div className="text-left">
                      <div className="font-medium">{template.title}</div>
                      <div className="text-sm text-gray-500">{template.price} so'm</div>
                    </div>
                  </Button>
                ))}
              </div>

              {updating && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Yangilanmoqda...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
