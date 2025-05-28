"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DeliveryLayout } from "@/components/delivery-layout"
import { MapPin, Navigation, Phone, Package, Clock, CheckCircle, Play, Square } from "lucide-react"

interface AssignedOrder {
  id: string
  vendorName: string
  customerName: string
  customerAddress: string
  customerPhone: string
  items: string[]
  total: number
  status: "assigned" | "picked_up" | "in_transit" | "delivered"
  pickupAddress: string
  estimatedTime: string
}

export default function DeliveryDashboard() {
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate fetching assigned orders
    setAssignedOrders([
      {
        id: "ORD002",
        vendorName: "Pizza Palace",
        customerName: "Jane Smith",
        customerAddress: "456 Oak Ave, Downtown",
        customerPhone: "+1234567891",
        items: ["Burger Combo", "Fries"],
        total: 18.5,
        status: "assigned",
        pickupAddress: "123 Restaurant St, Food District",
        estimatedTime: "25 mins",
      },
      {
        id: "ORD005",
        vendorName: "Burger House",
        customerName: "Mike Johnson",
        customerAddress: "789 Elm St, Suburbs",
        customerPhone: "+1234567895",
        items: ["Double Cheeseburger", "Onion Rings", "Milkshake"],
        total: 24.99,
        status: "picked_up",
        pickupAddress: "456 Food Court, Mall Area",
        estimatedTime: "15 mins",
      },
    ])
  }, [])

  const startTracking = (orderId: string) => {
    setActiveOrderId(orderId)
    setIsTracking(true)

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })

          toast({
            title: "Tracking started",
            description: "Your location is now being shared with the customer",
          })

          // Simulate location updates
          simulateLocationUpdates(orderId)
        },
        (error) => {
          console.error("Error getting location:", error)
          // Use simulated location for demo
          setCurrentLocation({
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.006 + (Math.random() - 0.5) * 0.01,
          })
          simulateLocationUpdates(orderId)
        },
      )
    } else {
      // Use simulated location for demo
      setCurrentLocation({
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.006 + (Math.random() - 0.5) * 0.01,
      })
      simulateLocationUpdates(orderId)
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
    setActiveOrderId(null)

    toast({
      title: "Tracking stopped",
      description: "Location sharing has been disabled",
    })
  }

  const simulateLocationUpdates = (orderId: string) => {
    const interval = setInterval(() => {
      if (!isTracking) {
        clearInterval(interval)
        return
      }

      setCurrentLocation((prev) => {
        if (!prev) return null
        return {
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
        }
      })
    }, 3000) // Update every 3 seconds
  }

  const updateOrderStatus = (orderId: string, newStatus: AssignedOrder["status"]) => {
    setAssignedOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))

    const statusMessages = {
      picked_up: "Order picked up from vendor",
      in_transit: "Delivery started - heading to customer",
      delivered: "Order delivered successfully",
    }

    toast({
      title: "Status updated",
      description: statusMessages[newStatus],
    })

    if (newStatus === "delivered") {
      stopTracking()
    }
  }

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

  return (
    <DeliveryLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned deliveries</p>
        </div>

        {/* Tracking Status */}
        {isTracking && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <CardTitle className="text-green-800">Live Tracking Active</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={stopTracking}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Tracking
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-green-700">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Location sharing enabled
                </div>
                {currentLocation && (
                  <div>
                    Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Assigned Orders</h2>

          {assignedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">Order {order.id}</CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {order.status.replace("_", " ")}
                      </div>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${order.total}</div>
                    <div className="text-sm text-muted-foreground">ETA: {order.estimatedTime}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pickup Details */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Pickup Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Vendor:</strong> {order.vendorName}
                      </p>
                      <p>
                        <strong>Address:</strong> {order.pickupAddress}
                      </p>
                      <div>
                        <strong>Items:</strong>
                        <ul className="mt-1 ml-4">
                          {order.items.map((item, index) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Details */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Delivery Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Customer:</strong> {order.customerName}
                      </p>
                      <p>
                        <strong>Phone:</strong> {order.customerPhone}
                      </p>
                      <p>
                        <strong>Address:</strong> {order.customerAddress}
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Customer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex flex-wrap gap-3">
                    {order.status === "assigned" && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, "picked_up")}
                          className="flex-1 sm:flex-none"
                        >
                          Mark as Picked Up
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => startTracking(order.id)}
                          disabled={isTracking}
                          className="flex-1 sm:flex-none"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Tracking
                        </Button>
                      </>
                    )}

                    {order.status === "picked_up" && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, "in_transit")}
                          className="flex-1 sm:flex-none"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Start Delivery
                        </Button>
                        {!isTracking && (
                          <Button
                            variant="outline"
                            onClick={() => startTracking(order.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Tracking
                          </Button>
                        )}
                      </>
                    )}

                    {order.status === "in_transit" && (
                      <Button onClick={() => updateOrderStatus(order.id, "delivered")} className="flex-1 sm:flex-none">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}

                    {order.status === "delivered" && (
                      <Badge variant="secondary" className="px-4 py-2">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Completed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {assignedOrders.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assigned orders</h3>
                <p className="text-muted-foreground">Orders assigned to you will appear here</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DeliveryLayout>
  )
}
