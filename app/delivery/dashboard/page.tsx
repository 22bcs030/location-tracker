"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DeliveryLayout } from "@/components/delivery-layout"
import { MapPin, Navigation, Phone, Package, Clock, CheckCircle, Play, Square, Loader2 } from "lucide-react"
import { orderService } from "@/services/api"
import socketService from "@/services/socket"

interface AssignedOrder {
  id: string
  orderNumber: string
  vendorName: string
  vendorId?: string
  customerName: string
  customerAddress: string
  customerPhone: string
  items: any[]
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
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Initialize socket connection
  useEffect(() => {
    // Get token from localStorage
    const userJson = localStorage.getItem('user')
    if (!userJson) return

    const user = JSON.parse(userJson)
    if (!user.token) return

    const socket = socketService.connect(user.token)

    // Listen for order updates
    socket.on('order:statusUpdated', (data) => {
      setAssignedOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === data.orderId ? { ...order, status: data.status } : order
        )
      )
    })

    return () => {
      socket.off('order:statusUpdated')
    }
  }, [])

  useEffect(() => {
    const fetchAssignedOrders = async () => {
      setIsLoading(true)
      try {
        // Get user ID from localStorage
        const userJson = localStorage.getItem('user')
        if (!userJson) {
          setIsLoading(false)
          return
        }

        const user = JSON.parse(userJson)
        
        // Call API to get assigned orders for the delivery partner
        const response = await orderService.getAssignedOrders(user.id)
        
        if (response.success) {
          // Transform API data to match our frontend model
          const transformedOrders = response.data.map((order: any) => ({
            id: order._id,
            orderNumber: order.orderNumber,
            vendorName: order.vendorId?.name || 'Restaurant',
            vendorId: order.vendorId?._id,
            customerName: order.customerId?.name || 'Customer',
            customerAddress: order.deliveryLocation?.address || 'Address not available',
            customerPhone: order.customerId?.phone || '+1234567890',
            items: order.items || [],
            total: order.totalAmount,
            status: order.status === 'picked' ? 'picked_up' : order.status,
            pickupAddress: order.pickupLocation?.address || 'Pickup location not available',
            estimatedTime: order.estimatedDeliveryTime ? 
              `${Math.round((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000)} mins` : 
              '25 mins'
          }))
          
          setAssignedOrders(transformedOrders)
        }
      } catch (error) {
        console.error('Error fetching assigned orders:', error)
        toast({
          title: 'Error',
          description: 'Failed to load assigned orders',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignedOrders()
  }, [toast])

  const startTracking = (orderId: string) => {
    setActiveOrderId(orderId)
    setIsTracking(true)

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          
          setCurrentLocation(location)

          // Update location in backend
          socketService.updateLocation(orderId, {
            latitude: location.lat,
            longitude: location.lng
          })

          toast({
            title: "Tracking started",
            description: "Your location is now being shared with the customer",
          })

          // Periodically update location
          startLocationUpdates(orderId)
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Location error",
            description: "Could not access your location. Using simulated location instead.",
            variant: "destructive",
          })
          
          // Use simulated location for demo
          const location = {
            lat: 40.7128 + (Math.random() - 0.5) * 0.01,
            lng: -74.006 + (Math.random() - 0.5) * 0.01,
          }
          setCurrentLocation(location)
          
          // Update simulated location in backend
          socketService.updateLocation(orderId, {
            latitude: location.lat,
            longitude: location.lng
          })
          
          startLocationUpdates(orderId)
        },
      )
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation. Using simulated location instead.",
        variant: "destructive",
      })
      
      // Use simulated location for demo
      const location = {
        lat: 40.7128 + (Math.random() - 0.5) * 0.01,
        lng: -74.006 + (Math.random() - 0.5) * 0.01,
      }
      setCurrentLocation(location)
      
      // Update simulated location in backend
      socketService.updateLocation(orderId, {
        latitude: location.lat,
        longitude: location.lng
      })
      
      startLocationUpdates(orderId)
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

  const startLocationUpdates = (orderId: string) => {
    const interval = setInterval(() => {
      if (!isTracking) {
        clearInterval(interval)
        return
      }

      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            
            setCurrentLocation(location)
            
            // Update location in backend
            socketService.updateLocation(orderId, {
              latitude: location.lat,
              longitude: location.lng
            })
          },
          () => {
            // If error, use simulated location
            const location = {
              lat: (currentLocation?.lat || 40.7128) + (Math.random() - 0.5) * 0.001,
              lng: (currentLocation?.lng || -74.006) + (Math.random() - 0.5) * 0.001,
            }
            
            setCurrentLocation(location)
            
            // Update simulated location in backend
            socketService.updateLocation(orderId, {
              latitude: location.lat,
              longitude: location.lng
            })
          }
        )
      } else {
        // If geolocation not supported, use simulated location
        const location = {
          lat: (currentLocation?.lat || 40.7128) + (Math.random() - 0.5) * 0.001,
          lng: (currentLocation?.lng || -74.006) + (Math.random() - 0.5) * 0.001,
        }
        
        setCurrentLocation(location)
        
        // Update simulated location in backend
        socketService.updateLocation(orderId, {
          latitude: location.lat,
          longitude: location.lng
      })
      }
    }, 10000) // Update every 10 seconds
    
    return interval
  }

  const updateOrderStatus = async (orderId: string, newStatus: AssignedOrder["status"]) => {
    try {
      // Call API to update order status
      const response = await orderService.updateOrderStatus(orderId, newStatus)
      
      if (response.success) {
        // Update local state
        setAssignedOrders((prev) => 
          prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
        )

    const statusMessages = {
      picked_up: "Order picked up from vendor",
      in_transit: "Delivery started - heading to customer",
      delivered: "Order delivered successfully",
    }

    toast({
      title: "Status updated",
      description: statusMessages[newStatus],
    })

        // Update status through socket
        socketService.updateOrderStatus(orderId, newStatus === 'picked_up' ? 'picked' : newStatus)

    if (newStatus === "delivered") {
      stopTracking()
        }
      } else {
        toast({
          title: "Update failed",
          description: response.error || "Could not update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast({
        title: "Update failed",
        description: "Could not update order status",
        variant: "destructive",
      })
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

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
                <div className="text-muted-foreground">Loading assigned orders...</div>
              </div>
            </div>
          ) : assignedOrders.length > 0 ? (
            assignedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
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
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{order.pickupAddress}</span>
                        </p>
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
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{order.customerAddress}</span>
                      </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{order.customerPhone}</span>
                      </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <ul className="text-sm space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.name || item.product?.name || `Item ${idx + 1}`} x{item.quantity}
                        </li>
                      ))}
                    </ul>
                </div>

                {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {order.status === "assigned" && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, "picked_up")}
                          className="bg-yellow-500 hover:bg-yellow-600"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Confirm Pickup
                        </Button>
                      </>
                    )}

                    {order.status === "picked_up" && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, "in_transit")}
                          className="bg-purple-500 hover:bg-purple-600"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Start Delivery
                        </Button>
                      </>
                    )}

                    {order.status === "in_transit" && (
                      <>
                        <Button onClick={() => updateOrderStatus(order.id, "delivered")} className="bg-green-500 hover:bg-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirm Delivery
                        </Button>
                      </>
                    )}

                    {/* Tracking Button - only for picked_up and in_transit */}
                    {(order.status === "picked_up" || order.status === "in_transit") && (
                      <>
                        {!isTracking || activeOrderId !== order.id ? (
                          <Button variant="outline" onClick={() => startTracking(order.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Start Tracking
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={stopTracking}>
                            <Square className="w-4 h-4 mr-2" />
                            Stop Tracking
                          </Button>
                        )}
                      </>
                    )}
                </div>
              </CardContent>
            </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <div className="text-muted-foreground text-center">
                  <p className="mb-2">No assigned orders yet</p>
                  <p className="text-sm">New orders assigned to you will appear here</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DeliveryLayout>
  )
}
