"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, BarChart3, Settings, LogOut, Menu, X, Save, User, Bell, Shield, Globe, Database, Key } from "lucide-react"
import { apiService } from "@/lib/api"
import { AdminSidebar } from "./sidebar"

export function SettingsManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: "Admin User",
    email: "admin@example.com",
    phone: "+998 90 123 45 67",
    avatar: "/placeholder-user.jpg"
  })

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    notifications: true,
    emailNotifications: false,
    darkMode: false,
    language: "uz",
    timezone: "Asia/Tashkent"
  })

  // API settings
  const [apiSettings, setApiSettings] = useState({
    baseUrl: "https://api.kelajakmerosi.uz/",
    timeout: 30000,
    retryAttempts: 3
  })

  const router = useRouter()

  const handleLogout = () => {
    apiService.clearTokens()
    router.push("/admin/login")
  }

  const handleSaveProfile = () => {
    // Save profile data
    console.log("Saving profile:", profileData)
    // Here you would typically make an API call to update the profile
  }

  const handleSaveSystemSettings = () => {
    // Save system settings
    console.log("Saving system settings:", systemSettings)
    // Here you would typically make an API call to update settings
  }

  const handleSaveApiSettings = () => {
    // Save API settings
    console.log("Saving API settings:", apiSettings)
    // Here you would typically make an API call to update API configuration
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
       <AdminSidebar currentPage="settings" />
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
              <h1 className="text-xl font-semibold text-gray-900">Sozlamalar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">Admin</Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Tizim</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>API</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Xavfsizlik</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profil ma'lumotlari</span>
                  </CardTitle>
                  <CardDescription>
                    Shaxsiy ma'lumotlaringizni yangilang
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback className="text-lg">AU</AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline">Rasmni o'zgartirish</Button>
                      <p className="text-sm text-gray-500 mt-1">JPG, PNG yoki GIF. Maksimal 2MB.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">To'liq ism</Label>
                      <Input
                        id="fullName"
                        value={profileData.fullName}
                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        placeholder="To'liq ismingizni kiriting"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon raqam</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+998 90 123 45 67"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                      <Save className="mr-2 h-4 w-4" />
                      Saqlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Tizim sozlamalari</span>
                  </CardTitle>
                  <CardDescription>
                    Tizim va interfeys sozlamalarini boshqaring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notifications">Bildirishnomalar</Label>
                        <p className="text-sm text-gray-500">Tizim bildirishnomalarini yoqish/o'chirish</p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={systemSettings.notifications}
                        onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, notifications: checked })}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email bildirishnomalari</Label>
                        <p className="text-sm text-gray-500">Email orqali bildirishnomalar yuborish</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={systemSettings.emailNotifications}
                        onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, emailNotifications: checked })}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="darkMode">Qorong'i rejim</Label>
                        <p className="text-sm text-gray-500">Qorong'i interfeys rejimini yoqish</p>
                      </div>
                      <Switch
                        id="darkMode"
                        checked={systemSettings.darkMode}
                        onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, darkMode: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="language">Til</Label>
                      <select
                        id="language"
                        value={systemSettings.language}
                        onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="uz">O'zbekcha</option>
                        <option value="ru">Русский</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="timezone">Vaqt mintaqasi</Label>
                      <select
                        id="timezone"
                        value={systemSettings.timezone}
                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="Asia/Tashkent">Toshkent (UTC+5)</option>
                        <option value="Asia/Samarkand">Samarqand (UTC+5)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveSystemSettings} className="bg-green-600 hover:bg-green-700">
                      <Save className="mr-2 h-4 w-4" />
                      Saqlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>API sozlamalari</span>
                  </CardTitle>
                  <CardDescription>
                    API integratsiyasi va ma'lumotlar bazasi sozlamalari
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="baseUrl">API Base URL</Label>
                      <Input
                        id="baseUrl"
                        value={apiSettings.baseUrl}
                        onChange={(e) => setApiSettings({ ...apiSettings, baseUrl: e.target.value })}
                        placeholder="https://api.example.com/"
                      />
                      <p className="text-sm text-gray-500 mt-1">API serverining asosiy manzili</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="timeout">Timeout (ms)</Label>
                        <Input
                          id="timeout"
                          type="number"
                          value={apiSettings.timeout}
                          onChange={(e) => setApiSettings({ ...apiSettings, timeout: parseInt(e.target.value) })}
                          placeholder="30000"
                        />
                        <p className="text-sm text-gray-500 mt-1">API so'rovlari uchun timeout</p>
                      </div>
                      <div>
                        <Label htmlFor="retryAttempts">Qayta urinishlar</Label>
                        <Input
                          id="retryAttempts"
                          type="number"
                          value={apiSettings.retryAttempts}
                          onChange={(e) => setApiSettings({ ...apiSettings, retryAttempts: parseInt(e.target.value) })}
                          placeholder="3"
                        />
                        <p className="text-sm text-gray-500 mt-1">Muvaffaqiyatsiz so'rovlar uchun qayta urinishlar</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">API Endpointlar</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div><strong>Login:</strong> POST /api/auth/login</div>
                      <div><strong>Verify OTP:</strong> POST /api/auth/verify</div>
                      <div><strong>Refresh Token:</strong> GET /api/auth/refresh-token</div>
                      <div><strong>User Profile:</strong> GET /api/auth/me</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={handleSaveApiSettings} className="bg-green-600 hover:bg-green-700">
                      <Save className="mr-2 h-4 w-4" />
                      Saqlash
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Xavfsizlik sozlamalari</span>
                  </CardTitle>
                  <CardDescription>
                    Hisob xavfsizligi va autentifikatsiya sozlamalari
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Parolni o'zgartirish</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currentPassword">Joriy parol</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            placeholder="Joriy parolingizni kiriting"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Yangi parol</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Yangi parolni kiriting"
                          />
                        </div>
                      </div>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        Parolni o'zgartirish
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Ikki bosqichli autentifikatsiya</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">SMS orqali tasdiqlash</p>
                          <p className="text-xs text-gray-500">Qo'shimcha xavfsizlik uchun</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-2">Sessiyalar</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">Joriy sessiya</p>
                            <p className="text-sm text-gray-500">Windows 10 • Chrome • Toshkent</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">Faol</Badge>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Barcha sessiyalarni tugatish
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
