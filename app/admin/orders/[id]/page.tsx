"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Package, Truck, CheckCircle, XCircle, Phone, Mail, MapPin, Calendar, DollarSign, RefreshCw } from 'lucide-react'
import { toast } from "sonner"

interface OrderItem {
  productId: string
  productName: string
  productImage?: string
  weight: string
  price: number
  quantity: number
}

interface Order {
  _id: string
  id: string
  customerName: string
  customerEmail: string
  customerMobile: string
  items: OrderItem[]
  total: number
  pricing: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  status: string
  paymentStatus: string
  paymentDetails?: {
    method?: string
    transactionId?: string
    status?: string
  }
  shippingAddress: {
    name: string
    email: string
    phone: string
    address1: string
    address2?: string
    city: string
    state?: string
    zip: string
    country?: string
  }
  createdAt: string
  updatedAt: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderStatus, setOrderStatus] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [notes, setNotes] = useState("")

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`)
      if (!res.ok) {
        if (res.status === 404) {
          setOrder(null)
          return
        }
        throw new Error("Failed to fetch order")
      }
      const data = await res.json()
      setOrder(data.order)
    } catch (err) {
      console.error("Failed to load order", err)
      toast.error("Failed to load order details")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
          <div className="space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Order Not Found</h1>
          <p className="text-stone-600 mb-6">The order you're looking for doesn't exist.</p>
          <Link href="/admin/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-orange-100 text-orange-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "shipped":
        return <Truck className="h-4 w-4" />
      case "confirmed":
        return <Package className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleStatusUpdate = async () => {
    if (!orderStatus) return
    setIsUpdating(true)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus, notes }),
      })

      if (!res.ok) throw new Error("Failed to update order")

      toast.success(`Order status updated to ${orderStatus}`)
      fetchOrder() // Refresh order data
      setOrderStatus("")
    } catch (err) {
      console.error("Failed to update order", err)
      toast.error("Failed to update order status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return
    
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "cancelled" }),
      })

      if (!res.ok) throw new Error("Failed to cancel order")

      toast.success("Order cancelled successfully")
      fetchOrder()
    } catch (err) {
      console.error("Failed to cancel order", err)
      toast.error("Failed to cancel order")
    } finally {
      setIsUpdating(false)
    }
  }

  const statusOptions = [
    { value: "pending", label: "Pending", icon: Package },
    { value: "confirmed", label: "Confirmed", icon: Package },
    { value: "shipped", label: "Shipped", icon: Truck },
    { value: "delivered", label: "Delivered", icon: CheckCircle },
    { value: "cancelled", label: "Cancelled", icon: XCircle },
  ]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">Order {order.id}</h1>
            <p className="text-stone-600">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(order.status)}
            <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="relative w-16 h-16">
                      <Image
                        src={item.productImage || "/placeholder.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-stone-900">{item.productName}</h3>
                      <p className="text-sm text-stone-600">Weight: {item.weight}</p>
                      <p className="text-sm text-stone-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{item.price.toLocaleString()}</p>
                      <p className="text-sm text-stone-600">Total: ₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{order.pricing?.subtotal?.toLocaleString() || order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>{order.pricing?.shipping === 0 ? "Free" : `₹${order.pricing?.shipping || 0}`}</span>
                </div>
                {order.pricing?.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{order.pricing.tax.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{order.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Order Placed</p>
                    <p className="text-sm text-stone-600">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.status !== "pending" && order.status !== "cancelled" && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <Package className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Confirmed</p>
                      <p className="text-sm text-stone-600">Processing started</p>
                    </div>
                  </div>
                )}
                {(order.status === "shipped" || order.status === "delivered") && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Truck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Shipped</p>
                      <p className="text-sm text-stone-600">Package is on the way</p>
                    </div>
                  </div>
                )}
                {order.status === "delivered" && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Delivered</p>
                      <p className="text-sm text-stone-600">Package delivered successfully</p>
                    </div>
                  </div>
                )}
                {order.status === "cancelled" && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Order Cancelled</p>
                      <p className="text-sm text-stone-600">Order was cancelled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-stone-900">{order.customerName}</h4>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2 text-sm text-stone-600">
                    <Mail className="h-4 w-4" />
                    <span>{order.customerEmail}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-stone-600">
                    <Phone className="h-4 w-4" />
                    <span>{order.customerMobile}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 mt-1 text-stone-400" />
                <div className="text-sm">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>
                    {order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""} - {order.shippingAddress.zip}
                  </p>
                  {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                  <p className="mt-2 text-stone-600">{order.shippingAddress.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Method:</span>
                <span className="font-medium capitalize">{order.paymentDetails?.method || "N/A"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-600">Status:</span>
                <Badge className={order.paymentStatus === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paymentDetails?.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Transaction ID:</span>
                  <span className="font-mono text-xs">{order.paymentDetails.transactionId}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Update Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Change Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this order..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleStatusUpdate}
                  disabled={!orderStatus || isUpdating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </Button>
                
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <Button
                    onClick={handleCancelOrder}
                    variant="destructive"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">Total: ₹{order.total.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Placed {new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
