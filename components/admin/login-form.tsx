"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Phone, MessageSquare } from "lucide-react"
import { apiService } from "@/lib/api"

export function LoginForm() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiService.login(phoneNumber)
      if (response.success) {
        setIsOtpSent(true)
        setSuccess("SMS kod yuborildi. Iltimos, kodni kiriting.")
      } else {
        setError(response.message || "Xatolik yuz berdi")
      }
    } catch (error) {
      setError("Telefon raqam noto'g'ri yoki tizimda xatolik")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await apiService.verifyOTP(phoneNumber, otpCode)
      if (response.success && response.data) {
        // Save tokens
        apiService.setTokens(response.data.accessToken, response.data.refreshToken)
        localStorage.setItem("admin_authenticated", "true")
        
        setSuccess("Muvaffaqiyatli kirish!")
        router.push("/admin/subjects")
      } else {
        setError(response.message || "Kod noto'g'ri")
      }
    } catch (error) {
      setError("Kod noto'g'ri yoki muddati tugagan")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setIsOtpSent(false)
    setOtpCode("")
    setError("")
    setSuccess("")
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {!isOtpSent ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                placeholder="+998 90 123 45 67"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-sm text-gray-500">
              SMS orqali tasdiqlash kodi yuboriladi
            </p>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Phone className="mr-2 h-4 w-4" />
            SMS kod yuborish
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">SMS kod</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              {phoneNumber} raqamiga yuborilgan kodni kiriting
            </p>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <MessageSquare className="mr-2 h-4 w-4" />
            Tasdiqlash
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={handleBackToPhone}
            disabled={isLoading}
          >
            <Phone className="mr-2 h-4 w-4" />
            Boshqa raqam
          </Button>
        </form>
      )}
    </div>
  )
}
