"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { DeliveryLayout } from "@/components/delivery-layout"
import { MapPin, Navigation, Phone, Package, Clock, CheckCircle, Play, Square, Loader2, Plus } from "lucide-react"
import { orderService } from "@/services/api"
import socketService from "@/services/socket"
import { OrderDetail } from "@/components/order-detail"
import { PerformanceDashboard } from "@/components/performance-dashboard"
import { AssignedOrder as AssignedOrderType, OrderStatus, AvailableOrder as AvailableOrderType } from "@/types/delivery"

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
  status: OrderStatus
  pickupAddress: string
  estimatedTime: string
  assignedAt: string
  pickedUpAt?: string
  inTransitAt?: string
  deliveredAt?: string
  vendorAddress?: string
  vendorPhone?: string
  commission?: number
  orderType?: "delivery" | "pickup"
  paymentMethod?: string
  specialInstructions?: string
  distance?: string
}

interface AvailableOrder {
  id: string
  orderNumber: string
  vendorName: string
  vendorId?: string
  customerAddress: string
  items: any[]
  total: number
  pickupAddress: string
  estimatedTime: string
  distance: string
}

export default function DeliveryDashboard() {
  const [assignedOrders, setAssignedOrders] = useState<AssignedOrder[]>([])
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState<string | null>(null)
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

    // Listen for new available orders
    socket.on('order:new', (data) => {
      fetchAvailableOrders()
    })

    return () => {
      socket.off('order:statusUpdated')
      socket.off('order:new')
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
            vendorAddress: order.pickupLocation?.address || 'Vendor address not available',
            vendorPhone: order.vendorId?.phone || '',
            customerName: order.customerId?.name || 'Customer',
            customerAddress: order.deliveryLocation?.address || 'Address not available',
            customerPhone: order.customerId?.phone || '+1234567890',
            items: order.items || [],
            total: order.totalAmount,
            commission: order.deliveryFee || 0,
            status: order.status === 'picked' ? 'picked_up' : order.status,
            orderType: "delivery",
            paymentMethod: order.paymentMethod || "Online Payment",
            specialInstructions: order.specialInstructions || '',
            pickupAddress: order.pickupLocation?.address || 'Pickup location not available',
            distance: order.distance || '2.5 km',
            estimatedTime: order.estimatedDeliveryTime ? 
              `${Math.round((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000)} mins` : 
              '25 mins',
            assignedAt: order.assignedAt || new Date().toISOString(),
            pickedUpAt: order.pickedAt,
            inTransitAt: order.inTransitAt,
            deliveredAt: order.deliveredAt
          }))
          
          setAssignedOrders(transformedOrders)
        }

        // Also fetch available orders
        fetchAvailableOrders()
      } catch (error) {
        console.error('Error fetching assigned orders:', error)
        toast({
          title: 'Error',
          description: 'Failed to load assigned orders',
          variant: 'destructive',
        })
        
        // Still try to fetch available orders even if assigned orders fail
        fetchAvailableOrders()
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignedOrders()
  }, [toast])

  const fetchAvailableOrders = async () => {
    try {
      // Try to fetch real available orders from API
      const response = await orderService.getOrders()
      
      if (response.success) {
        // Filter orders that are pending (not assigned yet)
        const availableOrdersData = response.data
          .filter((order: any) => order.status === 'pending' && !order.deliveryPartnerId)
          .map((order: any) => ({
            id: order._id,
            orderNumber: order.orderNumber,
            vendorName: order.vendorId?.name || 'Restaurant',
            vendorId: order.vendorId?._id,
            customerAddress: order.deliveryLocation?.address || 'Address not available',
            items: order.items || [],
            total: order.totalAmount,
            pickupAddress: order.pickupLocation?.address || 'Pickup location not available',
            estimatedTime: '30 mins',
            distance: '2.5 km'
          }))
        
        setAvailableOrders(availableOrdersData)
      } else {
        // If API call fails or returns no orders, use mock data
        generateMockOrders()
      }
    } catch (error) {
      console.error('Error fetching available orders:', error)
      // Use mock data as fallback
      generateMockOrders()
    }
  }

  const generateMockOrders = () => {
    // Generate 3 mock orders
    const mockOrders: AvailableOrder[] = [
      {
        id: `mock-${Date.now()}-1`,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'Burger Palace',
        customerAddress: '123 Main St, New York',
        items: [
          { name: 'Cheeseburger', quantity: 2, price: 12.99 },
          { name: 'Fries', quantity: 1, price: 4.99 }
        ],
        total: 30.97,
        pickupAddress: '789 Restaurant Ave, New York',
        estimatedTime: '25 mins',
        distance: '1.8 km'
      },
      {
        id: `mock-${Date.now()}-2`,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'Pizza Express',
        customerAddress: '456 Park Ave, New York',
        items: [
          { name: 'Pepperoni Pizza', quantity: 1, price: 18.99 },
          { name: 'Garlic Knots', quantity: 1, price: 5.99 }
        ],
        total: 24.98,
        pickupAddress: '101 Pizza St, New York',
        estimatedTime: '35 mins',
        distance: '2.3 km'
      },
      {
        id: `mock-${Date.now()}-3`,
        orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'Sushi House',
        customerAddress: '789 Broadway, New York',
        items: [
          { name: 'California Roll', quantity: 2, price: 14.99 },
          { name: 'Miso Soup', quantity: 2, price: 3.99 }
        ],
        total: 37.96,
        pickupAddress: '202 Sushi Blvd, New York',
        estimatedTime: '20 mins',
        distance: '1.5 km'
      }
    ]
    
    setAvailableOrders(mockOrders)
  }

  const assignOrderToMe = async (orderId: string) => {
    setIsAssigning(orderId)
    
    try {
      // Get user ID from localStorage
      const userJson = localStorage.getItem('user')
      if (!userJson) {
        toast({
          title: 'Error',
          description: 'You must be logged in to accept orders',
          variant: 'destructive',
        })
        return
      }

      const user = JSON.parse(userJson)
      
      // Check if it's a mock order
      if (orderId.startsWith('mock-')) {
        // For mock orders, create a simulated assigned order
        const mockOrder = availableOrders.find(order => order.id === orderId)
        
        if (mockOrder) {
          const newAssignedOrder: AssignedOrder = {
            id: mockOrder.id,
            orderNumber: mockOrder.orderNumber,
            vendorName: mockOrder.vendorName,
            vendorId: mockOrder.vendorId,
            customerName: 'Mock Customer',
            customerAddress: mockOrder.customerAddress,
            customerPhone: '+1234567890',
            items: mockOrder.items,
            total: mockOrder.total,
            status: 'assigned',
            pickupAddress: mockOrder.pickupAddress,
            estimatedTime: mockOrder.estimatedTime,
            assignedAt: new Date().toISOString(),
            vendorAddress: mockOrder.pickupAddress,
            commission: mockOrder.total * 0.1, // 10% commission
            orderType: "delivery",
            paymentMethod: "Online Payment",
            distance: mockOrder.distance
          }
          
          // Add to assigned orders
          setAssignedOrders(prev => [...prev, newAssignedOrder])
          
          // Remove from available orders
          setAvailableOrders(prev => prev.filter(order => order.id !== orderId))
          
          toast({
            title: 'Order assigned',
            description: `Order ${mockOrder.orderNumber} has been assigned to you`,
          })
        }
      } else {
        // For real orders, call the API
        const response = await orderService.assignDeliveryPartner(orderId, user.id)
        
        if (response.success) {
          toast({
            title: 'Order assigned',
            description: `Order has been assigned to you`,
          })
          
          // Refresh assigned orders
          const assignedResponse = await orderService.getAssignedOrders(user.id)
          
          if (assignedResponse.success) {
            const transformedOrders = assignedResponse.data.map((order: any) => ({
              id: order._id,
              orderNumber: order.orderNumber,
              vendorName: order.vendorId?.name || 'Restaurant',
              vendorId: order.vendorId?._id,
              vendorAddress: order.pickupLocation?.address || 'Vendor address not available',
              vendorPhone: order.vendorId?.phone || '',
              customerName: order.customerId?.name || 'Customer',
              customerAddress: order.deliveryLocation?.address || 'Address not available',
              customerPhone: order.customerId?.phone || '+1234567890',
              items: order.items || [],
              total: order.totalAmount,
              commission: order.deliveryFee || 0,
              status: order.status === 'picked' ? 'picked_up' : order.status,
              orderType: "delivery",
              paymentMethod: order.paymentMethod || "Online Payment",
              specialInstructions: order.specialInstructions || '',
              pickupAddress: order.pickupLocation?.address || 'Pickup location not available',
              distance: order.distance || '2.5 km',
              estimatedTime: order.estimatedDeliveryTime ? 
                `${Math.round((new Date(order.estimatedDeliveryTime).getTime() - Date.now()) / 60000)} mins` : 
                '25 mins',
              assignedAt: order.assignedAt || new Date().toISOString(),
              pickedUpAt: order.pickedAt,
              inTransitAt: order.inTransitAt,
              deliveredAt: order.deliveredAt
            }))
            
            setAssignedOrders(transformedOrders)
          }
          
          // Refresh available orders
          fetchAvailableOrders()
        } else {
          toast({
            title: 'Assignment failed',
            description: response.error || 'Could not assign order',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('Error assigning order:', error)
      toast({
        title: 'Assignment failed',
        description: 'Could not assign order',
        variant: 'destructive',
      })
    } finally {
      setIsAssigning(null)
    }
  }

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

  // Update order status with timestamps
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Call API to update order status
      const response = await orderService.updateOrderStatus(orderId, newStatus)
      
      if (response.success) {
        // Update local state with timestamps
        setAssignedOrders((prev) => 
          prev.map((order) => {
            if (order.id === orderId) {
              const updatedOrder = { ...order, status: newStatus };
              
              // Add timestamp based on status
              switch (newStatus) {
                case 'picked_up':
                  updatedOrder.pickedUpAt = new Date().toISOString();
                  break;
                case 'in_transit':
                  updatedOrder.inTransitAt = new Date().toISOString();
                  break;
                case 'delivered':
                  updatedOrder.deliveredAt = new Date().toISOString();
                  break;
              }
              
              return updatedOrder;
            }
            return order;
          })
        )

    const statusMessages = {
          assigned: "Order assigned to you",
      picked_up: "Order picked up from vendor",
      in_transit: "Delivery started - heading to customer",
      delivered: "Order delivered successfully",
          cancelled: "Order has been cancelled"
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
          <p className="text-muted-foreground">Manage your assigned deliveries and track your earnings</p>
        </div>

        {/* Performance Dashboard */}
        <PerformanceDashboard 
          userId={JSON.parse(localStorage.getItem('user') || '{}').id || ''}
        />

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
                    Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </div>
                )}
              </div>
              <div className="text-sm text-green-700 mt-1">
                Customer can see your live location
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Orders</h2>
          
          {availableOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map((order) => (
                <Card key={order.id} className="border-dashed border-2 border-blue-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50">
                        {order.distance}
                    </Badge>
                  </div>
                    <p className="text-sm text-muted-foreground">{order.vendorName}</p>
              </CardHeader>
              <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Items:</span>
                        <span>{order.items.length} items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Pickup:</span>
                        <span className="truncate max-w-[200px]">{order.pickupAddress}</span>
                    </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Delivery:</span>
                        <span className="truncate max-w-[200px]">{order.customerAddress}</span>
                  </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total:</span>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                </div>

                        <Button
                        className="w-full mt-2" 
                        onClick={() => assignOrderToMe(order.id)}
                        disabled={isAssigning === order.id}
                      >
                        {isAssigning === order.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Assign to Me
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
                  </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="text-muted-foreground text-center">
                  <p className="mb-2">No available orders at the moment</p>
                  <p className="text-sm">Check back later for new orders</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

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
            <div className="space-y-6">
              {assignedOrders.map((order) => (
                <OrderDetail 
                  key={order.id}
                  order={order as AssignedOrderType}
                  onStatusUpdate={updateOrderStatus}
                />
              ))}
            </div>
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
