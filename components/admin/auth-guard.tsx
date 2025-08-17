"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { apiService } from "@/lib/api"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have tokens
        const hasTokens = apiService.isAuthenticated()
        
        if (!hasTokens) {
          setIsAuthenticated(false)
          router.push("/admin/login")
          return
        }

        // Try to get user profile to validate token
        try {
          await apiService.getUserProfile()
          setIsAuthenticated(true)
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshed = await apiService.refreshTokenIfNeeded()
          if (refreshed) {
            setIsAuthenticated(true)
          } else {
            // Refresh failed, clear tokens and redirect to login
            apiService.clearTokens()
            setIsAuthenticated(false)
            router.push("/admin/login")
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        apiService.clearTokens()
        setIsAuthenticated(false)
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
