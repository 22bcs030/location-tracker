"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Truck, MapPin, Settings, LogOut, Bell } from "lucide-react"
import Link from "next/link"

export function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "delivery") {
      router.push("/auth/login?role=delivery")
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!user || user.role !== "delivery") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/delivery/dashboard" className="flex items-center gap-2">
                <Truck className="w-8 h-8 text-green-600" />
                <span className="text-xl font-bold">DeliveryTracker</span>
              </Link>
              <span className="text-sm text-gray-500">Delivery Partner</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.email}</span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/delivery/dashboard"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-900 border-b-2 border-green-500"
            >
              <Truck className="w-4 h-4" />
              Deliveries
            </Link>
            <Link
              href="/delivery/location"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <MapPin className="w-4 h-4" />
              Location
            </Link>
            <Link
              href="/delivery/settings"
              className="flex items-center gap-2 px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
