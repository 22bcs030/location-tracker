"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  role: "vendor" | "delivery" | "customer"
  name?: string
  token?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Ensure the role is explicitly set
        if (!userData.role && userData.token) {
          // Try to extract role from JWT token (assuming standard JWT format)
          try {
            const tokenPayload = JSON.parse(atob(userData.token.split('.')[1]));
            if (tokenPayload && tokenPayload.role) {
              userData.role = tokenPayload.role;
            }
          } catch (e) {
            console.error("Error extracting role from token:", e);
          }
        }
        console.log("Auth Provider - User data from localStorage:", userData);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = (userData: User) => {
    // Ensure the role is set
    if (!userData.role) {
      console.error("Login attempted without a role specified");
      return;
    }
    
    console.log("Auth Provider - Setting user data:", userData);
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
