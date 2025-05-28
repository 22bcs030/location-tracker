"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { VendorLayout } from "@/components/vendor-layout"
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Star,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Order {
  id: string
  customerName: string
  customerAddress: string
  customerPhone: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: "pending" | "assigned" | "in_transit" | "delivered"
  createdAt: string
  assignedPartner?: string
  estimatedDelivery?: string
  paymentMethod: string
  orderType: string
}

interface DeliveryPartner {
  id: string
  name: string
  phone: string
  rating: number
  isAvailable: boolean
  completedOrders: number
  avatar: string
  location?: string
}

export default function VendorDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    // Simulate fetching orders and delivery partners
    setOrders([
      {
        id: "ORD-9385",
        customerName: "John Doe",
        customerAddress: "123 Main St, City Center, NY 10001",
        customerPhone: "+1 (555) 123-4567",
        items: [
          { name: "Margherita Pizza (Large)", quantity: 1, price: 18.99 },
          { name: "Garlic Bread", quantity: 1, price: 4.5 },
          { name: "Coca Cola (500ml)", quantity: 2, price: 2.5 },
        ],
        total: 28.49,
        status: "pending",
        createdAt: "2024-01-15T10:30:00Z",
        paymentMethod: "Credit Card",
        orderType: "Delivery",
      },
      {
        id: "ORD-9384",
        customerName: "Jane Smith",
        customerAddress: "456 Oak Ave, Downtown, NY 10002",
        customerPhone: "+1 (555) 987-6543",
        items: [
          { name: "Double Cheeseburger", quantity: 2, price: 12.99 },
          { name: "French Fries (Large)", quantity: 1, price: 4.5 },
          { name: "Chocolate Milkshake", quantity: 2, price: 5.99 },
        ],
        total: 42.46,
        status: "assigned",
        createdAt: "2024-01-15T11:15:00Z",
        assignedPartner: "Mike Johnson",
        estimatedDelivery: "12:15 PM",
        paymentMethod: "PayPal",
        orderType: "Delivery",
      },
      {
        id: "ORD-9383",
        customerName: "Robert Wilson",
        customerAddress: "789 Pine St, Uptown, NY 10003",
        customerPhone: "+1 (555) 456-7890",
        items: [
          { name: "Pasta Alfredo", quantity: 1, price: 16.99 },
          { name: "Garlic Bread", quantity: 1, price: 4.5 },
          { name: "Tiramisu", quantity: 1, price: 7.99 },
          { name: "Sparkling Water", quantity: 2, price: 3.5 },
        ],
        total: 36.48,
        status: "in_transit",
        createdAt: "2024-01-15T09:45:00Z",
        assignedPartner: "Sarah Davis",
        estimatedDelivery: "11:00 AM",
        paymentMethod: "Cash on Delivery",
        orderType: "Delivery",
      },
      {
        id: "ORD-9382",
        customerName: "Emily Johnson",
        customerAddress: "321 Maple Rd, Westside, NY 10004",
        customerPhone: "+1 (555) 789-0123",
        items: [
          { name: "Vegetarian Pizza (Medium)", quantity: 1, price: 16.99 },
          { name: "Caesar Salad", quantity: 1, price: 8.99 },
          { name: "Iced Tea", quantity: 2, price: 2.99 },
        ],
        total: 31.96,
        status: "delivered",
        createdAt: "2024-01-15T08:30:00Z",
        assignedPartner: "Tom Brown",
        paymentMethod: "Credit Card",
        orderType: "Delivery",
      },
      {
        id: "ORD-9381",
        customerName: "Michael Brown",
        customerAddress: "567 Elm St, Eastside, NY 10005",
        customerPhone: "+1 (555) 234-5678",
        items: [
          { name: "Chicken Wings (12 pcs)", quantity: 1, price: 14.99 },
          { name: "Onion Rings", quantity: 1, price: 5.99 },
          { name: "Root Beer", quantity: 2, price: 2.99 },
        ],
        total: 26.96,
        status: "pending",
        createdAt: "2024-01-15T12:00:00Z",
        paymentMethod: "Apple Pay",
        orderType: "Pickup",
      },
    ])

    setDeliveryPartners([
      {
        id: "DP001",
        name: "Mike Johnson",
        phone: "+1 (555) 123-7890",
        rating: 4.8,
        isAvailable: true,
        completedOrders: 342,
        avatar: "/placeholder.svg?height=40&width=40",
        location: "Downtown",
      },
      {
        id: "DP002",
        name: "Sarah Davis",
        phone: "+1 (555) 987-6543",
        rating: 4.9,
        isAvailable: false,
        completedOrders: 521,
        avatar: "/placeholder.svg?height=40&width=40",
        location: "Midtown",
      },
      {
        id: "DP003",
        name: "Tom Brown",
        phone: "+1 (555) 456-7890",
        rating: 4.7,
        isAvailable: true,
        completedOrders: 287,
        avatar: "/placeholder.svg?height=40&width=40",
        location: "Uptown",
      },
      {
        id: "DP004",
        name: "Lisa White",
        phone: "+1 (555) 789-0123",
        rating: 4.6,
        isAvailable: true,
        completedOrders: 198,
        avatar: "/placeholder.svg?height=40&width=40",
        location: "Downtown",
      },
    ])
  }, [])

  const assignDeliveryPartner = (orderId: string, partnerId: string) => {
    const partner = deliveryPartners.find((p) => p.id === partnerId)
    if (!partner) return

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "assigned" as const,
              assignedPartner: partner.name,
              estimatedDelivery: new Date(Date.now() + 30 * 60000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : order,
      ),
    )

    setDeliveryPartners((prev) =>
      prev.map((partner) => (partner.id === partnerId ? { ...partner, isAvailable: false } : partner)),
    )

    toast({
      title: "Partner assigned",
      description: `${partner.name} has been assigned to order ${orderId}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200 dark:from-amber-900/20 dark:to-yellow-900/20 dark:text-amber-300 dark:border-amber-800"
      case "assigned":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-300 dark:border-blue-800"
      case "in_transit":
        return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-300 dark:border-purple-800"
      case "delivered":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-300 dark:border-green-800"
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 dark:from-gray-800/20 dark:to-slate-800/20 dark:text-gray-300 dark:border-gray-700"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "assigned":
        return <Truck className="w-4 h-4" />
      case "in_transit":
        return <Package className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const toggleExpand = (orderId: string) => {
    setIsExpanded((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    assigned: orders.filter((o) => o.status === "assigned").length,
    inTransit: orders.filter((o) => o.status === "in_transit").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.reduce((sum, order) => sum + order.total, 0),
  }

  const calculateTotal = (items: { name: string; quantity: number; price: number }[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  }

  return (
    <VendorLayout>
      <div className="space-y-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 min-h-screen -m-8 p-8">
        {/* Dashboard Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative glass rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="text-muted-foreground mt-2">Manage your orders and delivery assignments with ease</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="glass border-white/20">
                  <Calendar className="w-4 h-4 mr-2" />
                  Today
                </Button>
                <Button variant="outline" size="sm" className="glass border-white/20">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Package className="w-4 h-4 mr-2" />
                  New Order
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-500 text-white hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm font-medium">Assigned</p>
                  <p className="text-2xl font-bold">{stats.assigned}</p>
                </div>
                <Truck className="w-8 h-8 text-cyan-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">In Transit</p>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-emerald-500 text-white hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Delivered</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Revenue</p>
                  <p className="text-2xl font-bold">${stats.revenue.toFixed(0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Management */}
        <Card className="border-0 glass backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Order Management</CardTitle>
                <p className="text-muted-foreground">Track and manage all your orders in real-time</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search orders by ID or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass border-white/20 bg-white/50 dark:bg-black/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 glass border-white/20 bg-white/50 dark:bg-black/20">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enhanced Orders List */}
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`overflow-hidden border-0 glass backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    order.status === "pending"
                      ? "shadow-amber-500/10"
                      : order.status === "assigned"
                        ? "shadow-blue-500/10"
                        : order.status === "in_transit"
                          ? "shadow-purple-500/10"
                          : "shadow-green-500/10"
                  }`}
                >
                  <div
                    className={`h-1 w-full ${
                      order.status === "pending"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : order.status === "assigned"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                          : order.status === "in_transit"
                            ? "bg-gradient-to-r from-purple-500 to-pink-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                    }`}
                  ></div>

                  <CardHeader className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">{order.id}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            <span className="capitalize font-medium">{order.status.replace("_", " ")}</span>
                          </div>
                        </Badge>
                        {order.orderType === "Pickup" && (
                          <Badge variant="outline" className="glass border-white/20">
                            Pickup
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ${order.total.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">{order.paymentMethod}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleExpand(order.id)}
                          className="rounded-full hover:bg-white/20"
                          aria-label="Toggle order details"
                        >
                          {isExpanded[order.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded[order.id] && (
                    <CardContent className="pb-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="glass rounded-xl p-4 border border-white/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4 text-blue-500" />
                              Customer Details
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Name:</span>
                                <span className="font-medium">{order.customerName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-muted-foreground">Phone:</span>
                                <span>{order.customerPhone}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-green-100 dark:hover:bg-green-900/20"
                                >
                                  <Phone className="h-3 w-3 text-green-600" />
                                </Button>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="font-medium text-muted-foreground">Address:</span>
                                <span className="flex-1">{order.customerAddress}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                >
                                  <MapPin className="h-3 w-3 text-blue-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="glass rounded-xl p-4 border border-white/20">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Package className="w-4 h-4 text-purple-500" />
                              Order Items
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-muted-foreground">Qty: {item.quantity}</div>
                                  </div>
                                  <div className="font-bold text-green-600">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-between text-sm font-bold border-t pt-3 mt-3">
                                <div>Total Amount</div>
                                <div className="text-lg text-green-600">${calculateTotal(order.items)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.status === "pending" && (
                        <div className="mt-6 pt-4 border-t border-white/20">
                          <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Truck className="w-4 h-4 text-orange-500" />
                            Available Delivery Partners
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {deliveryPartners
                              .filter((partner) => partner.isAvailable)
                              .map((partner) => (
                                <div
                                  key={partner.id}
                                  className="glass rounded-xl p-4 border border-white/20 hover:border-blue-500/50 hover:shadow-lg transition-all duration-300 group"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="ring-2 ring-white/20">
                                      <AvatarImage src={partner.avatar || "/placeholder.svg"} alt={partner.name} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                        {partner.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{partner.name}</div>
                                      <div className="text-xs text-muted-foreground">{partner.location}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-xs mb-3">
                                    <div className="flex items-center gap-1">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      <span className="font-medium">{partner.rating}</span>
                                    </div>
                                    <div className="text-muted-foreground">{partner.completedOrders} orders</div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => assignDeliveryPartner(order.id, partner.id)}
                                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 group-hover:shadow-lg transition-all duration-300"
                                  >
                                    Assign Partner
                                  </Button>
                                </div>
                              ))}
                            {deliveryPartners.filter((partner) => partner.isAvailable).length === 0 && (
                              <div className="col-span-full text-center py-8">
                                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No available delivery partners</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {order.assignedPartner && (
                        <div className="mt-6 pt-4 border-t border-white/20">
                          <div className="glass rounded-xl p-4 border border-green-200 bg-green-50/50 dark:bg-green-900/20">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                                <Truck className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium text-green-800 dark:text-green-300">
                                  Assigned to: {order.assignedPartner}
                                </div>
                                {order.estimatedDelivery && (
                                  <div className="text-sm text-green-600 dark:text-green-400">
                                    ETA: {order.estimatedDelivery}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {filteredOrders.length === 0 && (
              <Card className="border-0 glass">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Orders will appear here when customers place them"}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </VendorLayout>
  )
}
