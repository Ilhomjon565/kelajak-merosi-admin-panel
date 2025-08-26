"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
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
import { Users, Menu, Plus, Edit, Trash2, Search, Lock, Unlock, Loader2 } from "lucide-react"
import { apiService, TestTemplate, UserProfile } from "@/lib/api"
import { AdminSidebar } from "./sidebar"
import Link from "next/link"

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
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingAccess, setIsLoadingAccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | 'no-data'>('loading')

  // Debounced search to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    name: "",
    phone: ""
  })

  const router = useRouter()

  // Helper function to map UserProfile to User
  const mapUserProfileToUser = (userProfile: UserProfile): User => ({
    id: userProfile.id.toString(),
    name: userProfile.fullName,
    phone: userProfile.phoneNumber,
    hasTestAccess: false, // Default value, will be updated when we fetch access data
    testAccessTemplate: undefined,
    testAccessCount: 0
  })

  // Memoized filtered users to prevent unnecessary recalculations
  const filteredUsers = useMemo(() => {
    if (debouncedSearchTerm === "") {
      return users
    }
    return users.filter(user => {
      const searchLower = debouncedSearchTerm.toLowerCase()
      const matchesId = user.id.toLowerCase().includes(searchLower)
      const matchesName = user.name.toLowerCase().includes(searchLower)
      const matchesPhone = user.phone.includes(debouncedSearchTerm)
      return matchesId || matchesName || matchesPhone
    })
  }, [users, debouncedSearchTerm])

  // Optimized data loading with error handling
  const loadUsersWithAccess = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Try to fetch all users with a very large size limit
      let res = await apiService.getUsers()
      
      console.log("API Response:", res)
      console.log("Response data:", res.data)
      console.log("Data type:", typeof res.data)
      console.log("Is array:", Array.isArray(res.data))
      console.log("Data length:", res.data?.length)
      
      // Check if API response is successful and has data
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Map UserProfile to User with default values
        const mappedUsers = res.data.map(mapUserProfileToUser)
        console.log("Mapped users:", mappedUsers)
        setUsers(mappedUsers)
        setApiStatus('success')
      } else {
        console.log("No data or invalid response")
        setApiStatus('no-data')
        setUsers([])
      }
      
      setIsLoadingAccess(false)
      
    } catch (error) {
      console.error("Error loading users:", error)
      setApiStatus('error')
      setUsers([])
      setIsLoadingAccess(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadTestTemplates = useCallback(async () => {
    try {
      setIsLoadingTemplates(true)
      const res = await apiService.getTestTemplates()
      setTestTemplates(res.data || [])
    } catch (error) {
      console.error("Error fetching test templates:", error)
      setTestTemplates([])
    } finally {
      setIsLoadingTemplates(false)
    }
  }, [])

  useEffect(() => {
    // Load users first, then templates in parallel
    loadUsersWithAccess()
    loadTestTemplates()
  }, [loadUsersWithAccess, loadTestTemplates])

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

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  )

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
          {/* Search and Filter */}
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ID, ism yoki telefon bo'yicha qidirish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        {filteredUsers.length} ta topildi
                      </div>
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Qidiruvni tozalash"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  onClick={loadUsersWithAccess}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Yangilash</span>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log("Current users state:", users)
                    console.log("Current API status:", apiStatus)
                    console.log("Current loading state:", isLoading)
                  }}
                  className="flex items-center space-x-2"
                >
                  Debug
                </Button>

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
                {!isLoading && users.length > 0 && (
                  <span className="ml-2 font-medium text-blue-600">
                    (Jami: {users.length} ta foydalanuvchi)
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2 font-medium text-green-600">
                    (Qidiruv natijasi: {filteredUsers.length} ta)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead>Telefon</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{user.id}</AvatarFallback>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isLoading && filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Foydalanuvchilar topilmadi</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {debouncedSearchTerm ? "Qidiruv natijalariga mos keladigan foydalanuvchilar yo'q." : "Hali foydalanuvchilar qo'shilmagan."}
                  </p>
                </div>
              )}

              {/* Display Summary */}
              {!isLoading && filteredUsers.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-600">
                    <strong>Ko'rsatilmoqda:</strong> {filteredUsers.length} ta foydalanuvchi 
                    {searchTerm && ` (qidiruv: "${searchTerm}")`}
                    {!searchTerm && ` (barchasi)`}
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
