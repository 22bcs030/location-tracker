"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Package, Truck, Loader2, AlertCircle } from "lucide-react"
import { authService } from "@/services/api"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Vendor {
  id: string;
  _id?: string;
  name: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
    businessName: "",
    vendorId: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  const [error, setError] = useState("")
  const [vendors, setVendors] = useState<Vendor[]>([
    // Default vendor for testing
    { id: "683830453ff3a5dd015b2485", name: "Test Vendor" }
  ])
  const [vendorError, setVendorError] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  // Fetch vendors when the component mounts or when role changes to delivery
  useEffect(() => {
    if (formData.role === "delivery") {
      fetchVendors();
    }
  }, [formData.role]);

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    setVendorError("");
    
    try {
      const response = await authService.getVendors();
      
      if (response.success && response.data) {
        // Transform vendor data to match our interface
        const vendorList = response.data.map((vendor: any) => ({
          id: vendor._id || vendor.id,
          name: vendor.name || vendor.businessName || `Vendor ${vendor.email}`,
        }));
        
        if (vendorList.length > 0) {
          setVendors(vendorList);
          // Auto-select the first vendor if none is selected
          if (!formData.vendorId) {
            setFormData(prev => ({ ...prev, vendorId: vendorList[0].id }));
          }
        } else {
          // Keep the default vendor if no vendors were returned
          setVendorError("No vendors found. Using default vendor.");
        }
      } else {
        // Keep the default vendor if the API call failed
        setVendorError("Could not fetch vendors. Using default vendor.");
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendorError("Could not fetch vendors. Using default vendor.");
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("") // Clear any previous errors when user makes changes
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      setError("Passwords do not match")
      return
    }

    // Check if a vendor is selected for delivery partners
    if (formData.role === "delivery" && !formData.vendorId) {
      toast({
        title: "Error",
        description: "Please select a vendor",
        variant: "destructive",
      })
      setError("Please select a vendor")
      return
    }

    setIsLoading(true)

    try {
      // Call the actual API service to register the user
      const response = await authService.register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
        formData.role === "delivery" ? formData.vendorId : undefined
      )

      // Create user data with role explicitly set
      const userData = {
        ...response.user,
        token: response.token,
        role: formData.role,
      };

      // Use the auth context to set the user
      login(userData);

      // Store user data in localStorage for immediate login
      localStorage.setItem("user", JSON.stringify(userData))

      toast({
        title: "Account created successfully",
        description: "Redirecting to your dashboard...",
      })

      // Redirect based on role with a slight delay to ensure localStorage is updated
      setTimeout(() => {
        switch (formData.role) {
          case "vendor":
            router.replace("/vendor/dashboard")
            break
          case "delivery":
            router.replace("/delivery/dashboard")
            break
          default:
            router.replace("/")
        }
      }, 300)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || "Registration failed. Please try again."
      setError(errorMessage)
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join our delivery platform today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Vendor
                    </div>
                  </SelectItem>
                  <SelectItem value="delivery">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Delivery Partner
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "vendor" && (
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                />
              </div>
            )}

            {formData.role === "delivery" && (
              <div className="space-y-2">
                <Label htmlFor="vendorId">Select Vendor</Label>
                <Select 
                  value={formData.vendorId} 
                  onValueChange={(value) => handleInputChange("vendorId", value)} 
                  disabled={isLoadingVendors}
                  required
                >
                  <SelectTrigger>
                    {isLoadingVendors ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading vendors...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select a vendor" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {vendorError && (
                  <Alert variant="warning" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{vendorError}</AlertDescription>
                  </Alert>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  Delivery partners must be associated with a vendor
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                required
              />
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:underline">
              ← Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
