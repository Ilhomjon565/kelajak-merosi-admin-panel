"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Menu, Plus, Edit, Trash2, Search, Lock, Unlock } from "lucide-react"
import { apiService, TestTemplate } from "@/lib/api"
import { AdminSidebar } from "./sidebar"

interface User {
  id: string
  name: string
  phone: string
  hasTestAccess: boolean
  testAccessTemplate?: string
  testAccessCount?: number
}

export function UsersManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [testTemplates, setTestTemplates] = useState<TestTemplate[]>([])
  
  useEffect(() =>{
    // Get users and their test access data
    const loadUsersWithAccess = async () => {
      try {
        const res = await apiService.getUsers()
        console.log(res.data)
        
        // Fetch test access data for each user
        const usersWithAccess = await Promise.all(
          res.data.map(async (userProfile: any) => {
            try {
              const accessRes = await apiService.getUserAccess(userProfile.id.toString())
              let hasTestAccess = false
              let testAccessCount = 0
              
              if (accessRes.success && accessRes.data && accessRes.data.length > 0) {
                const userAccessData = accessRes.data[0]
                const testTemplatesData = userAccessData.testTemplates || []
                hasTestAccess = testTemplatesData.length > 0
                testAccessCount = testTemplatesData.length
              }
              
              return {
                id: userProfile.id.toString(),
                name: userProfile.fullName,
                phone: userProfile.phoneNumber,
                hasTestAccess,
                testAccessTemplate: undefined,
                testAccessCount
              }
            } catch (error) {
              console.error(`Error fetching access for user ${userProfile.id}:`, error)
              return {
                id: userProfile.id.toString(),
                name: userProfile.fullName,
                phone: userProfile.phoneNumber,
                hasTestAccess: false,
                testAccessTemplate: undefined,
                testAccessCount: 0
              }
            }
          })
        )
        
        setUsers(usersWithAccess)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }
    
    loadUsersWithAccess()

    // Get test templates
    apiService.getTestTemplates().then((res) => {
      console.log("Test templates:", res.data)
      setTestTemplates(res.data)
    }).catch((error) => {
      console.error("Error fetching test templates:", error)
      // Fallback test templates if API fails
      setTestTemplates([])
    })
  },[])
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    phone: ""
  })

  const router = useRouter()

  const filteredUsers = users.filter(user => {
    if (searchTerm === "access") {
      return user.hasTestAccess
    }
    if (searchTerm === "no-access") {
      return !user.hasTestAccess
    }
    if (searchTerm === "") {
      return true
    }
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    return matchesSearch
  })

  const handleAddUser = () => {
    if (newUser.name.trim() && newUser.phone.trim()) {
      const user: User = {
        id: Date.now().toString(),
        name: newUser.name,
        phone: newUser.phone,
        hasTestAccess: false,
        testAccessTemplate: undefined
      }
      setUsers([...users, user])
      setNewUser({ name: "", phone: "" })
      setIsAddDialogOpen(false)
    }
  }

  const handleEditUser = async () => {
    if (editingUser && editingUser.name.trim() && editingUser.phone.trim()) {
      try {
        // API orqali user'ni yangilash
        const response = await apiService.updateUser(editingUser.id, {
          fullName: editingUser.name,
          phoneNumber: editingUser.phone
        })

        if (response.success) {
          // Local state'ni yangilash
          setUsers(users.map(user => 
            user.id === editingUser.id ? editingUser : user
          ))
          setEditingUser(null)
          
          // Success message ko'rsatish (toast yoki alert)
          console.log('Foydalanuvchi muvaffaqiyatli yangilandi')
        } else {
          console.error('Foydalanuvchini yangilashda xatolik:', response.message)
        }
      } catch (error) {
        console.error('API xatoligi:', error)
        // Error handling - user'ga xabar berish
      }
    }
  }

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id))
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
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Foydalanuvchilar boshqaruvi</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jami foydalanuvchilar</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Test ruxsati berilgan</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.hasTestAccess).length}</p>
                    <p className="text-xs text-gray-500">Jami ruxsatlar: {users.reduce((sum, u) => sum + (u.testAccessCount || 0), 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500">
                    <Unlock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Test ruxsati yo'q</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => !u.hasTestAccess).length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Ism yoki telefon bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Yangi foydalanuvchi
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Yangi foydalanuvchi qo'shish</DialogTitle>
                      <DialogDescription>
                        Yangi foydalanuvchi ma'lumotlarini kiriting
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">To'liq ism</Label>
                        <Input
                          id="name"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          placeholder="Masalan: Aziz Karimov"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefon</Label>
                        <Input
                          id="phone"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Bekor qilish
                      </Button>
                      <Button onClick={handleAddUser} className="bg-green-600 hover:bg-green-700">
                        Qo'shish
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Foydalanuvchilar ro'yxati</CardTitle>
              <CardDescription>
                Barcha ro'yxatdan o'tgan foydalanuvchilar va ularning ma'lumotlari
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                                     <TableHeader>
                     <TableRow>
                       <TableHead>Foydalanuvchi</TableHead>
                       <TableHead>Telefon</TableHead>
                       <TableHead>Test ruxsati</TableHead>
                       <TableHead>Amallar</TableHead>
                     </TableRow>
                   </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                                                 <TableCell>
                           <div className="flex items-center space-x-3">
                             <Avatar>
                               <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div>
                               <button 
                                 onClick={() => router.push(`/admin/users/${user.id}`)}
                                 className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                 title="Foydalanuvchi ma'lumotlarini ko'rish"
                               >
                                 {user.name}
                               </button>
                             </div>
                           </div>
                         </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">{user.phone}</div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {user.hasTestAccess ? (
                              <Badge className="bg-green-100 text-green-800">
                                <Unlock className="w-3 h-3 mr-1" />
                                {user.testAccessCount || 0} ruxsat
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <Lock className="w-3 h-3 mr-1" />
                                Ruxsat yo'q
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {/* Edit User */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:text-gray-900"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Foydalanuvchini tahrirlash</DialogTitle>
                                  <DialogDescription>
                                    Foydalanuvchi ma'lumotlarini o'zgartiring
                                  </DialogDescription>
                                </DialogHeader>
                                {editingUser && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-name">To'liq ism</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-phone">Telefon</Label>
                                      <Input
                                        id="edit-phone"
                                        value={editingUser.phone}
                                        onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>
                                    Bekor qilish
                                  </Button>
                                  <Button onClick={handleEditUser} className="bg-green-600 hover:bg-green-700">
                                    Saqlash
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bu foydalanuvchini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    O'chirish
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Foydalanuvchilar topilmadi</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Qidiruv natijalariga mos keladigan foydalanuvchilar yo'q.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
