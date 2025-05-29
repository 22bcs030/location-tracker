"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { Truck, MapPin, Settings, LogOut, Bell } from "lucide-react"
import Link from "next/link"

export function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after auth state is loaded and if user is not a delivery partner
    if (!isLoading && (!user || user.role !== "delivery")) {
      router.replace("/auth/login?role=delivery")
    }
  }, [user, router, isLoading])

  const handleLogout = () => {
    logout()
    router.replace("/")
  }

  // Show nothing while loading or if not authenticated as delivery partner
  if (isLoading || !user || user.role !== "delivery") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Truck className="w-12 h-12 text-green-600 mb-4" />
          <div className="text-lg">Loading delivery dashboard...</div>
        </div>
      </div>
    )
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
