"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Package, Truck, User, ArrowLeft, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const defaultRole = searchParams.get("role") || ""
  const initialRole = defaultRole || "vendor"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const selectedRole = role || defaultRole || initialRole

      // Store user data in localStorage (in real app, use proper auth)
      localStorage.setItem(
        "user",
        JSON.stringify({
          email,
          role: selectedRole,
          id: Math.random().toString(36).substr(2, 9),
        }),
      )

      toast({
        title: "Login successful",
        description: `Welcome back! Redirecting to ${selectedRole} dashboard.`,
      })

      // Redirect based on role
      switch (selectedRole) {
        case "vendor":
          router.push("/vendor/dashboard")
          break
        case "delivery":
          router.push("/delivery/dashboard")
          break
        default:
          router.push("/")
      }

      setIsLoading(false)
    }, 1000)
  }

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case "vendor":
        return <Package className="w-5 h-5" />
      case "delivery":
        return <Truck className="w-5 h-5" />
      default:
        return <User className="w-5 h-5" />
    }
  }

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case "vendor":
        return "bg-blue-500 text-white"
      case "delivery":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-100 text-gray-900"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="border-t-4 border-t-blue-500 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                {defaultRole ? getRoleIcon(defaultRole) : <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your {defaultRole ? defaultRole : ""} account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!defaultRole && (
              <Tabs defaultValue={initialRole} className="mb-6" onValueChange={(value) => setRole(value)}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="vendor" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Vendor</span>
                  </TabsTrigger>
                  <TabsTrigger value="delivery" className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Delivery Partner</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {defaultRole && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getRoleIcon(defaultRole)}
                  <span className="font-medium capitalize">{defaultRole} Login</span>
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 border-t pt-4">
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
                Create account
              </Link>
            </div>

            <div className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
