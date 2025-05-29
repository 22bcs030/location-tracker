import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapComponent } from '@/components/map-component';
import { OrderTimeline } from '@/components/order-timeline';
import { ETACalculator } from '@/components/eta-calculator';
import { useLocationTracker } from '@/hooks/use-location-tracker';
import { AssignedOrder, LocationData } from '@/types/delivery';
import { 
  Phone, 
  MapPin, 
  Package, 
  Navigation, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  DollarSign,
  Play,
  Square,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import socketService from '@/services/socket';

interface OrderDetailProps {
  order: AssignedOrder;
  onStatusUpdate: (orderId: string, status: AssignedOrder['status']) => Promise<void>;
  className?: string;
}

export function OrderDetail({ order, onStatusUpdate, className = '' }: OrderDetailProps) {
  const [activeTab, setActiveTab] = useState('details');
  const { toast } = useToast();
  
  // Convert pickup and delivery coordinates
  const pickupCoords: [number, number] = [
    parseFloat(order.pickupAddress.split(',')[0] || '40.7128'),
    parseFloat(order.pickupAddress.split(',')[1] || '-74.006')
  ];
  
  const deliveryCoords: [number, number] = [
    parseFloat(order.customerAddress.split(',')[0] || '40.7328'),
    parseFloat(order.customerAddress.split(',')[1] || '-73.986')
  ];
  
  // Use location tracker hook
  const { 
    isTracking,
    currentLocation,
    locationHistory,
    startTracking,
    stopTracking,
    error: locationError
  } = useLocationTracker({
    orderId: order.id,
    intervalMs: 3000,
    enableHighAccuracy: true,
    simulateFallback: true,
  });

  // Handle tracking status changes
  useEffect(() => {
    if (locationError) {
      toast({
        title: 'Location Error',
        description: locationError,
        variant: 'destructive',
      });
    }
  }, [locationError, toast]);

  // Auto-start tracking when status changes to in_transit
  useEffect(() => {
    if (order.status === 'in_transit' && !isTracking) {
      startTracking();
    }
    
    if (order.status === 'delivered' && isTracking) {
      stopTracking();
    }
  }, [order.status, isTracking, startTracking, stopTracking]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: AssignedOrder['status']) => {
    try {
      await onStatusUpdate(order.id, newStatus);
      
      if (newStatus === 'in_transit' && !isTracking) {
        startTracking();
      }
      
      if (newStatus === 'delivered' && isTracking) {
        stopTracking();
      }
    } catch (error) {
      toast({
        title: 'Status Update Failed',
        description: 'Could not update order status',
        variant: 'destructive',
      });
    }
  };

  // Handle call customer
  const handleCallCustomer = () => {
    if (order.customerPhone) {
      window.location.href = `tel:${order.customerPhone}`;
    }
  };

  // Handle call vendor
  const handleCallVendor = () => {
    if (order.vendorPhone) {
      window.location.href = `tel:${order.vendorPhone}`;
    }
  };

  // Handle message customer
  const handleMessageCustomer = () => {
    if (order.customerPhone) {
      window.location.href = `sms:${order.customerPhone}`;
    }
  };

  // Handle navigation
  const handleNavigate = () => {
    if (currentLocation) {
      const destination = order.status === 'assigned' || order.status === 'picked_up'
        ? `${pickupCoords[0]},${pickupCoords[1]}`
        : `${deliveryCoords[0]},${deliveryCoords[1]}`;
      
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination}`, '_blank');
    } else {
      toast({
        title: 'Navigation Error',
        description: 'Could not determine your current location',
        variant: 'destructive',
      });
    }
  };

  // Format timestamps
  const timestamps = {
    assigned: order.assignedAt,
    picked_up: order.pickedUpAt,
    in_transit: order.inTransitAt,
    delivered: order.deliveredAt,
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Clock className="w-4 h-4" />;
      case 'picked_up':
        return <Package className="w-4 h-4" />;
      case 'in_transit':
        return <Navigation className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Order {order.orderNumber}</CardTitle>
            <Badge className={getStatusColor(order.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(order.status)}
                {order.status.replace('_', ' ')}
              </div>
            </Badge>
          </div>
          <div className="text-right">
            <div className="font-semibold">${order.total.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              Commission: ${order.commission?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="details" className="m-0">
          <CardContent className="p-6">
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
                  {order.vendorPhone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{order.vendorPhone}</span>
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCallVendor}
                    disabled={!order.vendorPhone}
                    className="mt-2"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Vendor
                  </Button>
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
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCallCustomer}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMessageCustomer}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Items
              </h4>
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-4 text-left font-medium">Item</th>
                      <th className="py-2 px-4 text-center font-medium">Qty</th>
                      <th className="py-2 px-4 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-4">
                          {item.name || item.product?.name || `Item ${idx + 1}`}
                          {item.specialRequests && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.specialRequests}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-4 text-center">{item.quantity}</td>
                        <td className="py-2 px-4 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/30">
                      <td colSpan={2} className="py-2 px-4 text-right font-medium">
                        Total:
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        ${order.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {order.specialInstructions && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm">
                  <div className="font-medium mb-1">Special Instructions:</div>
                  <div>{order.specialInstructions}</div>
                </div>
              )}
            </div>

            {/* Payment Info */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <div className="font-medium">{order.paymentMethod || 'Online Payment'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Type:</span>
                  <div className="font-medium">{order.orderType || 'Delivery'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Your Earnings:</span>
                  <div className="font-medium">${order.commission?.toFixed(2) || '0.00'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Distance:</span>
                  <div className="font-medium">{order.distance || 'Calculating...'}</div>
                </div>
              </div>
            </div>

            {/* ETA Calculator */}
            {(order.status === 'picked_up' || order.status === 'in_transit') && currentLocation && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <ETACalculator
                  currentLocation={currentLocation}
                  destinationLocation={deliveryCoords}
                  initialETA={order.estimatedTime}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {order.status === "assigned" && (
                <Button
                  onClick={() => handleStatusUpdate("picked_up")}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Confirm Pickup
                </Button>
              )}

              {order.status === "picked_up" && (
                <Button
                  onClick={() => handleStatusUpdate("in_transit")}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Delivery
                </Button>
              )}

              {order.status === "in_transit" && (
                <Button 
                  onClick={() => handleStatusUpdate("delivered")} 
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Delivery
                </Button>
              )}

              {/* Tracking Button - only for picked_up and in_transit */}
              {(order.status === "picked_up" || order.status === "in_transit") && (
                <>
                  {!isTracking ? (
                    <Button variant="outline" onClick={startTracking}>
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

              {/* Navigate Button */}
              <Button variant="outline" onClick={handleNavigate}>
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="map" className="m-0">
          <div className="h-[400px]">
            <MapComponent
              currentLocation={currentLocation}
              pickupLocation={pickupCoords}
              deliveryLocation={deliveryCoords}
              locationHistory={locationHistory}
              showRoute={true}
              showHistory={true}
              isTracking={isTracking}
              height="400px"
              className="rounded-b-lg"
            />
          </div>
          
          <div className="p-4">
            {(order.status === 'picked_up' || order.status === 'in_transit') && currentLocation && (
              <ETACalculator
                currentLocation={currentLocation}
                destinationLocation={
                  order.status === 'picked_up' ? pickupCoords : deliveryCoords
                }
                initialETA={order.estimatedTime}
              />
            )}
            
            <div className="mt-4 flex gap-2">
              {!isTracking ? (
                <Button 
                  onClick={startTracking}
                  disabled={order.status === 'delivered' || order.status === 'cancelled'}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Tracking
                </Button>
              ) : (
                <Button variant="secondary" onClick={stopTracking}>
                  <Square className="w-4 h-4 mr-2" />
                  Stop Tracking
                </Button>
              )}
              
              <Button variant="outline" onClick={handleNavigate}>
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('timeline')}
              >
                <History className="w-4 h-4 mr-2" />
                View Timeline
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline" className="m-0">
          <CardContent className="p-6">
            <OrderTimeline status={order.status} timestamps={timestamps} />
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              {order.status === "assigned" && (
                <Button
                  onClick={() => handleStatusUpdate("picked_up")}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Confirm Pickup
                </Button>
              )}

              {order.status === "picked_up" && (
                <Button
                  onClick={() => handleStatusUpdate("in_transit")}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Delivery
                </Button>
              )}

              {order.status === "in_transit" && (
                <Button 
                  onClick={() => handleStatusUpdate("delivered")} 
                  className="bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Delivery
                </Button>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 