"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MapComponent } from "@/components/map-component"
import { OrderTimeline } from "@/components/order-timeline"
import { ETACalculator } from "@/components/eta-calculator"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, Clock, MapPin, Navigation, Package, Phone, Search, Loader2, AlertCircle } from "lucide-react"
import { trackingService } from "@/services/api"
import socketService from "@/services/socket"
import { Socket } from "socket.io-client"
import { useLocationTracker } from "@/hooks/use-location-tracker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface TrackingData {
  orderId: string
  orderNumber: string
  status: "pending" | "assigned" | "picked" | "in_transit" | "delivered" | "cancelled"
  customerName: string
  vendorName: string
  deliveryPartner: {
    name: string
    phone: string
    currentLocation: { lat: number; lng: number }
  }
  pickupAddress: string
  pickupLocation?: { lat: number; lng: number }
  deliveryAddress: string
  deliveryLocation: { lat: number; lng: number }
  estimatedTime: string
  items: any[]
  total: number
  timestamps?: {
    pending?: string
    assigned?: string
    picked?: string
    in_transit?: string
    delivered?: string
  }
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [trackingToken, setTrackingToken] = useState("demo-token") // Default token for demo
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [trackingSocket, setTrackingSocket] = useState<Socket | null>(null)
  const [showMap, setShowMap] = useState(true)

  // Connect to tracking socket when component mounts
  useEffect(() => {
    const socket = socketService.connectToTracking();
    setTrackingSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  // Join order tracking room when tracking data is available
  useEffect(() => {
    if (trackingData && trackingSocket) {
      socketService.joinTracking(trackingData.orderNumber, trackingToken, trackingSocket);
      
      // Listen for location updates
      trackingSocket.on('location:updated', (data) => {
        console.log('Location updated:', data);
        
        if (data.orderNumber === trackingData.orderNumber) {
          setTrackingData(prev => {
            if (!prev) return null;
            return {
              ...prev,
              deliveryPartner: {
                ...prev.deliveryPartner,
                currentLocation: {
                  lat: data.location.latitude,
                  lng: data.location.longitude
                }
              }
            };
          });
        }
      });
      
      // Listen for status updates
      trackingSocket.on('order:statusUpdated', (data) => {
        console.log('Status updated:', data);
        
        if (data.orderNumber === trackingData.orderNumber) {
          setTrackingData(prev => {
            if (!prev) return null;
            
            // Update the timestamps for this status
            const updatedTimestamps = {
              ...prev.timestamps,
              [data.status]: new Date().toISOString()
            };
            
            return {
              ...prev,
              status: data.status,
              timestamps: updatedTimestamps
            };
          });
        }
      });
      
      return () => {
        trackingSocket.off('location:updated');
        trackingSocket.off('order:statusUpdated');
      };
    }
  }, [trackingData, trackingSocket, trackingToken]);

  const trackOrder = async () => {
    if (!orderNumber.trim()) {
      setError("Please enter an order number")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Call the tracking API
      const response = await trackingService.trackOrder(orderNumber, trackingToken);
      
      if (response.success) {
        const orderData = response.data;
        
        // Extract coordinates from addresses if they're embedded as "lat,lng"
        const extractCoordinates = (address: string) => {
          const parts = address.split(',').map(part => part.trim());
          if (parts.length >= 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
            return {
              lat: parseFloat(parts[0]),
              lng: parseFloat(parts[1])
            };
          }
          return null;
        };
        
        const pickupCoords = orderData.pickupLocation?.coordinates 
          ? { lat: orderData.pickupLocation.coordinates[1], lng: orderData.pickupLocation.coordinates[0] }
          : extractCoordinates(orderData.pickupLocation?.address || '');
        
        const deliveryCoords = orderData.deliveryLocation?.coordinates 
          ? { lat: orderData.deliveryLocation.coordinates[1], lng: orderData.deliveryLocation.coordinates[0] }
          : extractCoordinates(orderData.deliveryLocation?.address || '');
        
        // Get current timestamps or create new ones
        const timestamps = orderData.statusHistory || {};
        if (!timestamps.pending && orderData.createdAt) {
          timestamps.pending = orderData.createdAt;
        }
        
        // Transform API response to match our frontend model
        setTrackingData({
          orderId: orderData.orderId || orderData._id,
          orderNumber: orderData.orderNumber,
          status: orderData.status,
          customerName: orderData.customerId?.name || "Customer",
          vendorName: orderData.vendorId?.name || "Vendor",
          deliveryPartner: {
            name: orderData.deliveryPartnerId?.name || "Delivery Partner",
            phone: orderData.deliveryPartnerId?.phone || "+1234567890",
            currentLocation: orderData.currentLocation ? {
              lat: orderData.currentLocation.latitude || orderData.currentLocation.coordinates?.[1],
              lng: orderData.currentLocation.longitude || orderData.currentLocation.coordinates?.[0]
            } : { lat: 40.7128, lng: -74.006 } // Default to NYC if no location
          },
          pickupAddress: orderData.pickupLocation?.address || "Pickup Location",
          pickupLocation: pickupCoords || undefined,
          deliveryAddress: orderData.deliveryLocation?.address || "Delivery Location",
          deliveryLocation: deliveryCoords || { lat: 40.7128 + 0.01, lng: -74.006 + 0.01 },
          estimatedTime: orderData.estimatedDeliveryTime ? 
            new Date(orderData.estimatedDeliveryTime).toLocaleTimeString() : 
            "30 mins",
          items: orderData.items || [],
          total: orderData.totalAmount || 0,
          timestamps
        });
      } else {
        setError("Order not found. Please check your order number.");
        setTrackingData(null);
      }
    } catch (err) {
      console.error("Error tracking order:", err);
      setError("Unable to track order. Please try again later.");
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "picked":
        return "bg-yellow-100 text-yellow-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <Clock className="w-4 h-4" />
      case "picked":
        return <Package className="w-4 h-4" />
      case "in_transit":
        return <Navigation className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "assigned":
        return "Delivery partner assigned"
      case "picked":
        return "Order picked up from restaurant"
      case "in_transit":
        return "On the way to you"
      case "delivered":
        return "Order delivered"
      case "cancelled":
        return "Order cancelled"
      default:
        return "Processing"
    }
  }

  // Demo data for testing
  const loadDemoData = () => {
    setOrderNumber("DEMO123");
    
    // Create mock tracking data
    const demoData: TrackingData = {
      orderId: "demo-123",
      orderNumber: "DEMO123",
      status: "in_transit",
      customerName: "Demo Customer",
      vendorName: "Demo Restaurant",
      deliveryPartner: {
        name: "John Delivery",
        phone: "+1 (555) 123-4567",
        currentLocation: { lat: 40.7128, lng: -74.006 }
      },
      pickupAddress: "123 Restaurant St, New York",
      pickupLocation: { lat: 40.7128, lng: -74.006 },
      deliveryAddress: "456 Customer Ave, New York",
      deliveryLocation: { lat: 40.7228, lng: -73.996 },
      estimatedTime: "15 minutes",
      items: [
        { name: "Burger", quantity: 1, price: 12.99 },
        { name: "Fries", quantity: 1, price: 4.99 },
        { name: "Soda", quantity: 2, price: 2.99 }
      ],
      total: 23.96,
      timestamps: {
        pending: new Date(Date.now() - 40 * 60000).toISOString(),
        assigned: new Date(Date.now() - 30 * 60000).toISOString(),
        picked: new Date(Date.now() - 15 * 60000).toISOString(),
        in_transit: new Date(Date.now() - 10 * 60000).toISOString()
      }
    };
    
    setTrackingData(demoData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-600">Enter your order number to see real-time delivery updates</p>
            <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              ← Back to home
            </Link>
          </div>

          {/* Search Form */}
          <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
              <CardDescription>Enter your order number to track your delivery in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    id="orderNumber"
                    placeholder="Enter order number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && trackOrder()}
                    className="bg-white"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={trackOrder} disabled={isLoading} className="flex-1 sm:flex-none">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Track
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadDemoData}
                    className="flex-1 sm:flex-none"
                  >
                    Demo
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {isLoading ? (
            <div className="space-y-6">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Skeleton className="h-4 w-32 mb-3" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                    <div>
                      <Skeleton className="h-4 w-32 mb-3" />
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : trackingData && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Order {trackingData.orderNumber}</CardTitle>
                      <CardDescription>Placed with {trackingData.vendorName}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(trackingData.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(trackingData.status)}
                        <span className="capitalize">{trackingData.status.replace("_", " ")}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delivery Info */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Delivery Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <p>
                          <span className="font-medium">Status:</span>{" "}
                          <span className="capitalize">{getStatusMessage(trackingData.status)}</span>
                        </p>
                        <p>
                          <span className="font-medium">Delivery Address:</span> {trackingData.deliveryAddress}
                        </p>
                        
                        <div className="pt-1">
                          <ETACalculator 
                            currentLocation={{
                              ...trackingData.deliveryPartner.currentLocation,
                              timestamp: new Date().toISOString()
                            }}
                            destinationLocation={[
                              trackingData.deliveryLocation.lat,
                              trackingData.deliveryLocation.lng
                            ]}
                            initialETA={trackingData.estimatedTime}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Partner Info */}
                    {trackingData.status !== "pending" && (
                      <div>
                        <h3 className="font-semibold mb-3">Delivery Partner</h3>
                        <div className="space-y-3 text-sm">
                          <p>
                            <span className="font-medium">Name:</span> {trackingData.deliveryPartner.name}
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span> {trackingData.deliveryPartner.phone}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <Button variant="outline" size="sm">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Driver
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone className="w-4 h-4 mr-2" />
                              Call Vendor
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Timeline */}
                  <div className="mt-8 border-t pt-6">
                    <h3 className="font-semibold mb-3">Order Progress</h3>
                    <OrderTimeline 
                      status={trackingData.status === "picked" ? "picked_up" : trackingData.status as any}
                      timestamps={{
                        assigned: trackingData.timestamps?.assigned,
                        picked_up: trackingData.timestamps?.picked,
                        in_transit: trackingData.timestamps?.in_transit,
                        delivered: trackingData.timestamps?.delivered
                      }}
                    />
                  </div>

                  {/* Order Items */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="bg-white rounded-md p-4">
                      <ul className="space-y-2 text-sm">
                        {trackingData.items.map((item, index) => (
                          <li key={index} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.name || item.product?.name || `Item ${index + 1}`}
                            </span>
                            <span>${item.price?.toFixed(2) || "0.00"}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${trackingData.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map */}
              {(trackingData.status === "picked" || trackingData.status === "in_transit") && (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Live Tracking</CardTitle>
                        <CardDescription>
                          Watch as your delivery partner brings your order to you in real-time
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}>
                        {showMap ? "Hide Map" : "Show Map"}
                      </Button>
                    </div>
                  </CardHeader>
                  {showMap && (
                    <CardContent>
                      <div className="h-96 w-full rounded-md overflow-hidden border">
                        <MapComponent
                          currentLocation={{
                            ...trackingData.deliveryPartner.currentLocation,
                            timestamp: new Date().toISOString()
                          }}
                          deliveryLocation={trackingData.deliveryLocation}
                          pickupLocation={trackingData.pickupLocation}
                          showRoute={true}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <div className="flex items-center mr-4">
                          <div className="w-3 h-3 rounded-full bg-blue-600 mr-1"></div>
                          <span>Driver</span>
                        </div>
                        {trackingData.pickupLocation && (
                          <div className="flex items-center mr-4">
                            <div className="w-3 h-3 rounded-full bg-green-600 mr-1"></div>
                            <span>Pickup</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-600 mr-1"></div>
                          <span>Destination</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
