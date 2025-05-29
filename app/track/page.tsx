"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapComponent } from "@/components/map-component"
import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, Clock, MapPin, Navigation, Package, Phone, Search, Loader2 } from "lucide-react"
import { trackingService } from "@/services/api"
import socketService from "@/services/socket"
import { Socket } from "socket.io-client"

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
  deliveryAddress: string
  estimatedTime: string
  items: any[]
  total: number
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("")
  const [trackingToken, setTrackingToken] = useState("demo-token") // Default token for demo
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [trackingSocket, setTrackingSocket] = useState<Socket | null>(null)

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
            return {
              ...prev,
              status: data.status
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
              lat: orderData.currentLocation.latitude,
              lng: orderData.currentLocation.longitude
            } : { lat: 40.7128, lng: -74.006 } // Default to NYC if no location
          },
          pickupAddress: orderData.pickupLocation?.address || "Pickup Location",
          deliveryAddress: orderData.deliveryLocation?.address || "Delivery Location",
          estimatedTime: orderData.estimatedDeliveryTime ? 
            new Date(orderData.estimatedDeliveryTime).toLocaleTimeString() : 
            "30 mins",
          items: orderData.items || [],
          total: orderData.totalAmount || 0
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
            <p className="text-gray-600">Enter your order number to see real-time delivery updates</p>
            <Link href="/" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
              ← Back to home
            </Link>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
              <CardDescription>Enter your order number to track your delivery in real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    placeholder="Enter order number"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && trackOrder()}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={trackOrder} disabled={isLoading}>
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
                </div>
              </div>

              {error && <div className="mt-4 text-sm text-red-500">{error}</div>}
            </CardContent>
          </Card>

          {/* Tracking Results */}
          {trackingData && (
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
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
                        <p>
                          <span className="font-medium">Estimated Delivery:</span> {trackingData.estimatedTime}
                        </p>
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
                        <Button variant="outline" size="sm" className="mt-2">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Driver
                        </Button>
                      </div>
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Order Items</h3>
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
                </CardContent>
              </Card>

              {/* Map */}
              {trackingData.status === "in_transit" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Live Tracking</CardTitle>
                    <CardDescription>
                      Watch as your delivery partner brings your order to you in real-time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 w-full rounded-md overflow-hidden border">
                      <MapComponent
                        driverLocation={trackingData.deliveryPartner.currentLocation}
                        destination={{
                          lat: parseFloat(trackingData.deliveryAddress.split(",")[0]) || 40.7128 + 0.01,
                          lng: parseFloat(trackingData.deliveryAddress.split(",")[1]) || -74.006 + 0.01,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
