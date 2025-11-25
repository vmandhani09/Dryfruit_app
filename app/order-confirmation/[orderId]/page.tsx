"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  Loader2,
  Home,
  ShoppingBag,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

type OrderItem = {
  productId: string;
  productName: string;
  weight: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    email: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zip: string;
  };
  pricing: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  paymentDetails?: {
    method?: string;
    transactionId?: string;
    status?: string;
  };
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: <Package className="h-4 w-4" /> },
  confirmed: { color: "bg-blue-100 text-blue-800", label: "Confirmed", icon: <CheckCircle2 className="h-4 w-4" /> },
  shipped: { color: "bg-purple-100 text-purple-800", label: "Shipped", icon: <Truck className="h-4 w-4" /> },
  delivered: { color: "bg-green-100 text-green-800", label: "Delivered", icon: <CheckCircle2 className="h-4 w-4" /> },
  cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled", icon: <Package className="h-4 w-4" /> },
};

export default function OrderConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("userToken") : null;
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/orders/${resolvedParams.orderId}`, { headers });
        
        if (!res.ok) {
          toast.error("Order not found");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrder(data.order);
      } catch (err) {
        console.error("Error fetching order:", err);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (resolvedParams.orderId) {
      fetchOrder();
    }
  }, [resolvedParams.orderId]);

  const copyOrderId = () => {
    const id = order?.orderId || order?._id || "";
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("Order ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn&apos;t find the order you&apos;re looking for.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push("/")}>
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
              <Button variant="outline" onClick={() => router.push("/account")}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[order.orderStatus] || statusConfig.pending;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
        <p className="text-gray-600">Your order has been placed successfully</p>
      </div>

      {/* Order ID Card */}
      <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="text-lg font-semibold font-mono">{order.orderId || order._id}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={copyOrderId}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied" : "Copy ID"}
              </Button>
              <Badge className={status.color}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.productName}</h4>
                      <p className="text-sm text-gray-600">
                        {item.weight} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.price * item.quantity}</p>
                      <p className="text-sm text-gray-500">₹{item.price} each</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Pricing Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{order.pricing.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={order.pricing.shipping === 0 ? "text-emerald-600" : ""}>
                    {order.pricing.shipping === 0 ? "Free" : `₹${order.pricing.shipping}`}
                  </span>
                </div>
                {order.pricing.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span>₹{order.pricing.tax}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-emerald-600">₹{order.pricing.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Address & Payment */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p className="text-gray-600">{order.shippingAddress.phone}</p>
                <p className="text-gray-600">{order.shippingAddress.email}</p>
                <p className="text-gray-600 mt-2">{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p className="text-gray-600">{order.shippingAddress.address2}</p>
                )}
                <p className="text-gray-600">
                  {order.shippingAddress.city} - {order.shippingAddress.zip}
                </p>
                {order.shippingAddress.state && (
                  <p className="text-gray-600">{order.shippingAddress.state}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium capitalize">
                    {order.paymentDetails?.method || "Razorpay"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge 
                    variant={order.paymentStatus === "completed" ? "default" : "secondary"}
                    className={order.paymentStatus === "completed" ? "bg-emerald-100 text-emerald-800" : ""}
                  >
                    {order.paymentStatus === "completed" ? "Paid" : order.paymentStatus}
                  </Badge>
                </div>
                {order.paymentDetails?.transactionId && (
                  <div className="pt-2 border-t">
                    <p className="text-gray-600 text-xs">Transaction ID</p>
                    <p className="font-mono text-xs break-all">{order.paymentDetails.transactionId}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Date */}
          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-center">
                <p className="text-gray-600">Order placed on</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleTimeString("en-IN")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
        <Button onClick={() => router.push("/shop")} size="lg">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Continue Shopping
        </Button>
        <Button variant="outline" onClick={() => router.push("/account")} size="lg">
          <Package className="h-5 w-5 mr-2" />
          View All Orders
        </Button>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>A confirmation email has been sent to <strong>{order.shippingAddress.email}</strong></p>
        <p className="mt-1">
          Need help? Contact us at{" "}
          <a href="tel:+919359682328" className="text-emerald-600 hover:underline">
            +91 9359682328
          </a>
        </p>
      </div>
    </div>
  );
}


