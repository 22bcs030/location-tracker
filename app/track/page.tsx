"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapComponent } from "@/components/map-component"
import { Search, MapPin, Phone, Package, Clock, Navigation, CheckCircle } from "lucide-react"
import Link from "next/link"

interface TrackingData {
  orderId: string
  status: "assigned" | "picked_up" | "in_transit" | "delivered"
  customerName: string
  vendorName: string
  deliveryPartner: {
    name: string
    phone: string
    currentLocation: { lat: number; lng: number }
  }
  pickupAddress: string
  deliveryAddress: string
  estimatedTime: string
  items: string[]
  total: number
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const trackOrder = async () => {
    if (!orderId.trim()) {
      setError("Please enter an order ID")
      return
    }

    setIsLoading(true)
    setError("")

    // Simulate API call
    setTimeout(() => {
      // Simulate finding order
      if (orderId.toUpperCase() === "ORD002" || orderId.toUpperCase() === "ORD005") {
        setTrackingData({
          orderId: orderId.toUpperCase(),
          status: "in_transit",
          customerName: "Jane Smith",
          vendorName: "Pizza Palace",
          deliveryPartner: {
            name: "Mike Johnson",
            phone: "+1234567893",
            currentLocation: {
              lat: 40.7128 + (Math.random() - 0.5) * 0.01,
              lng: -74.006 + (Math.random() - 0.5) * 0.01,
            },
          },
          pickupAddress: "123 Restaurant St, Food District",
          deliveryAddress: "456 Oak Ave, Downtown",
          estimatedTime: "12 mins",
          items: ["Burger Combo", "Fries"],
          total: 18.5,
        })
      } else {
        setError("Order not found. Please check your order ID.")
        setTrackingData(null)
      }
      setIsLoading(false)
    }, 1000)
  }

  // Simulate real-time location updates
  useEffect(() => {
    if (!trackingData || trackingData.status === "delivered") return

    const interval = setInterval(() => {
      setTrackingData((prev) => {
        if (!prev) return null
        return {
          ...prev,
          deliveryPartner: {
            ...prev.deliveryPartner,
            currentLocation: {
              lat: prev.deliveryPartner.currentLocation.lat + (Math.random() - 0.5) * 0.001,
              lng: prev.deliveryPartner.currentLocation.lng + (Math.random() - 0.5) * 0.001,
            },
          },
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [trackingData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "picked_up":
        return "bg-yellow-100 text-yellow-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <Clock className="w-4 h-4" />
      case "picked_up":
        return <Package className="w-4 h-4" />
      case "in_transit":
        return <Navigation className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "assigned":
        return "Delivery partner assigned"
      case "picked_up":
        return "Order picked up from restaurant"
      case "in_transit":
        return "On the way to you"
      case "delivered":
        return "Order delivered"
      default:
        return "Processing"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-600">Enter your order ID to see real-time delivery updates</p>
            <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              ← Back to home
            </Link>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
              <CardDescription>Enter your order ID to track your delivery in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="Enter order ID (try ORD002 or ORD005)"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && trackOrder()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={trackOrder} disabled={isLoading}>
                    <Search className="w-4 h-4 mr-2" />
                    {isLoading ? "Tracking..." : "Track Order"}
                  </Button>
                </div>
              </div>
              {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order {trackingData.orderId}</CardTitle>
                      <CardDescription>From {trackingData.vendorName}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(trackingData.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(trackingData.status)}
                        {getStatusMessage(trackingData.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Order Details</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Customer:</strong> {trackingData.customerName}
                        </p>
                        <p>
                          <strong>Total:</strong> ${trackingData.total}
                        </p>
                        <div>
                          <strong>Items:</strong>
                          <ul className="mt-1 ml-4">
                            {trackingData.items.map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Delivery Partner</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Name:</strong> {trackingData.deliveryPartner.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {trackingData.deliveryPartner.phone}
                        </p>
                        <p>
                          <strong>ETA:</strong> {trackingData.estimatedTime}
                        </p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Driver
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Live Map */}
              {trackingData.status === "in_transit" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Live Tracking
                    </CardTitle>
                    <CardDescription>Real-time location of your delivery partner</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 rounded-lg overflow-hidden">
                      <MapComponent
                        deliveryLocation={trackingData.deliveryPartner.currentLocation}
                        pickupAddress={trackingData.pickupAddress}
                        deliveryAddress={trackingData.deliveryAddress}
                      />
                    </div>
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Live tracking active</span>
                        <span className="text-sm">• Updates every 3 seconds</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Order Confirmed</p>
                        <p className="text-sm text-muted-foreground">Your order has been confirmed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Delivery Partner Assigned</p>
                        <p className="text-sm text-muted-foreground">
                          {trackingData.deliveryPartner.name} will deliver your order
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          ["picked_up", "in_transit", "delivered"].includes(trackingData.status)
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Package
                          className={`w-4 h-4 ${
                            ["picked_up", "in_transit", "delivered"].includes(trackingData.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">Order Picked Up</p>
                        <p className="text-sm text-muted-foreground">Order collected from {trackingData.vendorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          ["in_transit", "delivered"].includes(trackingData.status) ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <Navigation
                          className={`w-4 h-4 ${
                            ["in_transit", "delivered"].includes(trackingData.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">Out for Delivery</p>
                        <p className="text-sm text-muted-foreground">Your order is on the way</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trackingData.status === "delivered" ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <CheckCircle
                          className={`w-4 h-4 ${
                            trackingData.status === "delivered" ? "text-green-600" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">Delivered</p>
                        <p className="text-sm text-muted-foreground">Order delivered to your address</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
