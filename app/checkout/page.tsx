"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/userAuth";
import { STATES, fetchCitiesByState, validatePincode } from "@/lib/indiaData";
import { toast } from "sonner";
import { Loader2, Plus, Check } from "lucide-react";

type ShippingForm = {
  name: string;
  email: string;
  mobile: string;
  houseOrFlat: string;
  street: string;
  city: string;
  pincode: string;
  state: string;
  notes?: string;
};

const EMPTY_FORM: ShippingForm = {
  name: "",
  email: "",
  mobile: "",
  houseOrFlat: "",
  street: "",
  city: "",
  pincode: "",
  state: "",
  notes: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();


  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
    }
  }, [isAuthLoading, user, router]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step UI
  const [addingAddress, setAddingAddress] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(null);

  // Form data (will be filled from selected address or manual)
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [pincodeMessage, setPincodeMessage] = useState<string>("");

  // derived
  const subtotal = useMemo(() => getCartTotal(), [cart, getCartTotal]);
  const shipping = subtotal >= 500 ? 0 : 50;
  const total = subtotal + shipping;

  // user's saved addresses (if logged in)
  const savedAddresses = useMemo(() => {
    return (user?.addresses ?? []) as any[];
  }, [user]);

  useEffect(() => {
    // if user selects a saved address index, auto-fill form and collapse add panel
    if (selectedAddressIndex !== null && savedAddresses[selectedAddressIndex]) {
      const a = savedAddresses[selectedAddressIndex];
      setForm({
        name: a.fullName ?? "",
        email: user?.email ?? "",
        mobile: a.phone ?? "",
        houseOrFlat: a.house ?? "",
        street: a.street ?? "",
        city: a.city ?? "",
        pincode: a.pincode ?? "",
        state: a.state ?? "",
        notes: "",
      });
      if (a.state) {
        fetchCitiesByState(a.state).then((list) => setCities(list || []));
      } else {
        setCities([]);
      }
      setAddingAddress(false);
      setPincodeStatus(a.pincode ? "valid" : "idle");
    }
  }, [selectedAddressIndex, savedAddresses, user]);

  useEffect(() => {
    // load cities when state changes (for manual/adding address)
    if (form.state) {
      fetchCitiesByState(form.state).then((list) => setCities(list || []));
    } else {
      setCities([]);
    }
  }, [form.state]);

  // helpers
  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("userToken") ?? null;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setForm((prev) => ({ ...prev, pincode: digits }));
      if (digits.length === 6) {
        setPincodeStatus("checking");
        validatePincode(digits)
          .then((res) => {
            if (res.valid) {
              setPincodeStatus("valid");
              setPincodeMessage(res.message ?? "Valid pincode");
            } else {
              setPincodeStatus("invalid");
              setPincodeMessage(res.message ?? "Invalid pincode");
            }
          })
          .catch(() => {
            setPincodeStatus("invalid");
            setPincodeMessage("Unable to validate pincode");
          });
      } else {
        setPincodeStatus("idle");
        setPincodeMessage("");
      }
    }

    if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, mobile: digits }));
    }

    if (name === "state") {
      setForm((prev) => ({ ...prev, state: value, city: "" }));
      setCities([]);
      if (value) fetchCitiesByState(value).then((list) => setCities(list || []));
    }
  };

  const validateForm = async (input: ShippingForm) => {
    if (!input.name?.trim()) {
      toast.error("Full name is required.");
      return false;
    }
    if (!input.email?.trim()) {
      toast.error("Email is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(input.mobile)) {
      toast.error("Mobile number must be 10 digits and start with 6-9.");
      return false;
    }
    if (!input.houseOrFlat?.trim()) {
      toast.error("House / Flat information is required.");
      return false;
    }
    if (!input.street?.trim()) {
      toast.error("Street / Area is required.");
      return false;
    }
    if (!input.state) {
      toast.error("Please select a state.");
      return false;
    }
    if (!input.city) {
      toast.error("Please select a city.");
      return false;
    }
    if (!/^\d{6}$/.test(input.pincode)) {
      toast.error("PIN code must be 6 digits.");
      return false;
    }
    if (pincodeStatus !== "valid") {
      try {
        const res = await validatePincode(input.pincode);
        if (!res.valid) {
          toast.error(res.message ?? "Invalid PIN code.");
          return false;
        }
      } catch {
        toast.error("Unable to validate PIN code.");
        return false;
      }
    }
    return true;
  };

  const buildItemsPayload = () =>
    cart.map((item) => {
      const price = item.product?.weights?.find((w) => w.label === item.weight)?.price || 0;
      return {
        productId: item.productId,
        productName: item.product?.name || "Product",
        weight: item.weight,
        price,
        quantity: item.quantity,
      };
    });

  // load Razorpay SDK if not present
  const loadRazorpay = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") return reject(new Error("window is undefined"));
      if ((window as any).Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });
  };

  const createRazorpayOrderOnServer = async (amount: number, orderMeta: any) => {
    // server should create order and return { orderId: string, amount, currency, keyId }
    // amount should be in paise (rupees × 100)
    const res = await fetch("/api/payment/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100), meta: orderMeta }),
    });
    return res;
  };

  const verifyRazorpayOnServer = async (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderMeta?: any;
  }) => {
    const res = await fetch("/api/payment/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res;
  };

  const saveOrderRecord = async (orderPayload: any, token?: string | null) => {
    // call your /api/orders to persist order in DB
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/orders", {
      method: "POST",
      headers,
      body: JSON.stringify(orderPayload),
    });
    return res;
  };

  // main entry: create razorpay order, open popup, verify, save order
  const handlePlaceOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      // determine shippingAddress like before
      let shippingAddress;
      if (user && selectedAddressIndex !== null && savedAddresses[selectedAddressIndex]) {
        const a = savedAddresses[selectedAddressIndex];
        shippingAddress = {
          name: a.fullName,
          email: user.email,
          phone: a.phone,
          address1: `${a.house}, ${a.street}`,
          city: a.city,
          zip: a.pincode,
          state: a.state,
        };
      } else {
        // validate current form
        const ok = await validateForm(form);
        if (!ok) {
          setIsProcessing(false);
          return;
        }
        shippingAddress = {
          name: form.name,
          email: form.email,
          phone: form.mobile,
          address1: `${form.houseOrFlat}, ${form.street}`,
          city: form.city,
          zip: form.pincode,
          state: form.state,
        };
      }

      const items = buildItemsPayload();
      const pricing = { subtotal, shipping, tax: 0, total };

      // Build a server-side metadata for the order
      const orderMeta = {
        items,
        pricing,
        shippingAddress,
        customer: user ? { id: user.id ?? user.id ?? null, email: user.email, name: user.name } : { id: null, email: shippingAddress.email, name: shippingAddress.name },
      };

      // Create Razorpay order on server (server must use key_secret)
      toast.loading("Creating payment...");
      const createRes = await createRazorpayOrderOnServer(Math.round(total), orderMeta);

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({ error: "Failed to create order" }));
        // Ensure error is a string, not an object
        const errorMsg = typeof errData.error === 'object' 
          ? errData.error?.description || errData.error?.code || "Failed to create payment order"
          : errData.error || "Failed to create payment order";
        toast.dismiss();
        toast.error(errorMsg);
        setIsProcessing(false);
        return;
      }
      const createData = await createRes.json();
      const { orderId: razorpayOrderId, amount: allowedAmount, currency, keyId } = createData;

      // Load Razorpay SDK
      try {
        await loadRazorpay();
      } catch (err) {
        toast.error("Failed to load payment SDK");
        setIsProcessing(false);
        return;
      }

      // Prepare options for Razorpay popup
      const options: any = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: allowedAmount, // amount already in paise from server
        currency: currency || "INR",
        name: "Dryfruit Grove",
        description: "Order payment",
        order_id: razorpayOrderId,
        prefill: {
          name: shippingAddress.name,
          email: shippingAddress.email,
          contact: shippingAddress.phone,
        },
        theme: {
          color: "#059669",
        },
        handler: async function (response: any) {
          // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          toast.loading("Verifying payment...");
          try {
            const verifyRes = await verifyRazorpayOnServer({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderMeta,
            });

            if (!verifyRes.ok) {
              const err = await verifyRes.json().catch(() => ({ error: "Verification failed" }));
              toast.error(err.error || "Payment verification failed");
              setIsProcessing(false);
              return;
            }

            const verifyData = await verifyRes.json();
            if (!verifyData.verified) {
              toast.error("Payment signature verification failed.");
              setIsProcessing(false);
              return;
            }

            // Save order in DB (with payment details) - you can also combine verify+save on server if preferred
            const token = getToken();
            const orderPayload = {
              items,
              shippingAddress,
              pricing,
              paymentDetails: {
                method: "razorpay",
                transactionId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                status: "completed",
                metadata: verifyData, // server verification info
              },
              orderStatus: "confirmed",
              paymentStatus: "completed",
            };

            const saveRes = await saveOrderRecord(orderPayload, token);
            if (!saveRes.ok) {
              const err = await saveRes.json().catch(() => ({ error: "Order save failed" }));
              toast.error(err.error || "Order could not be saved. Contact support.");
              setIsProcessing(false);
              return;
            }
            const saved = await saveRes.json();

            // success — clear cart, redirect to success page
            clearCart?.();
            toast.success("Payment successful! Redirecting...");
            // store order id for success page
            if (typeof window !== "undefined") {
              sessionStorage.setItem("orderId", saved.orderId ?? saved._id ?? "");
            }
            setIsProcessing(false);
            router.push("/payment-success");
          } catch (err) {
            console.error("Verify handler error:", err);
            toast.error("Verification failed. Contact support.");
            setIsProcessing(false);
          }
        },
        notes: {
          // optional metadata
        },
        modal: {
          ondismiss: function () {
            toast("Payment popup closed.");
            setIsProcessing(false);
          },
        },
      };

      // open razorpay
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        // response.error
        console.error("Razorpay payment failed", response);
        toast.error(response?.error?.description || "Payment failed. Please try again.");
        setIsProcessing(false);
      });
      rzp.open();
      toast.dismiss(); // remove previous loading toasts
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("An error occurred placing your order.");
      setIsProcessing(false);
    }
  };

  // UI: Address Card component
  const AddressCard = ({ addr, idx }: { addr: any; idx: number }) => {
    const isSelected = idx === selectedAddressIndex;
    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-shadow ${isSelected ? "border-emerald-500 shadow-md" : "border-gray-200 hover:shadow-sm"}`}
        onClick={() => setSelectedAddressIndex(idx)}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">{addr.fullName}</p>
            <p className="text-sm text-muted-foreground mt-1">{addr.phone}</p>
            <p className="text-sm mt-2">{addr.house}, {addr.street}</p>
            <p className="text-sm">{addr.city} - {addr.pincode}, {addr.state}</p>
            {addr.landmark && <p className="text-sm text-muted-foreground">Landmark: {addr.landmark}</p>}
          </div>
          <div className="ml-4">
            {isSelected ? (
              <div className="flex items-center text-emerald-600 font-medium">
                <Check className="h-5 w-5 mr-1" /> Selected
              </div>
            ) : (
              <div className="text-sm text-gray-500">Select</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No items in cart</h1>
        <p className="text-gray-600">Add some products before checkout</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Complete your order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Shipping */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              {/* If logged-in and has saved addresses, show them */}
              {!isAuthLoading && user && savedAddresses.length > 0 && (
                <div className="space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Choose a saved address</h3>
                    <Button variant="outline" size="sm" onClick={() => { setAddingAddress((s) => !s); setSelectedAddressIndex(null); }}>
                      <Plus className="h-4 w-4 mr-2" /> {addingAddress ? "Close" : "Add New"}
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {savedAddresses.map((a: any, idx: number) => (
                      <AddressCard key={idx} addr={a} idx={idx} />
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => {
                        if (selectedAddressIndex === null) {
                          toast.error("Please select an address or choose Add New to enter one.");
                          return;
                        }
                        toast.success("Address selected.");
                      }}
                    >
                      Use selected address
                    </Button>
                  </div>
                </div>
              )}

              {/* If guest or adding new address (or no saved addresses), show the form */}
              {(addingAddress || !user || savedAddresses.length === 0) && (
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input name="name" id="name" value={form.name} onChange={handleInput} required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input name="email" id="email" type="email" value={form.email} onChange={handleInput} required />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile *</Label>
                      <Input name="mobile" id="mobile" value={form.mobile} onChange={handleInput} required />
                    </div>
                    <div>
                      <Label htmlFor="pincode">PIN Code *</Label>
                      <Input name="pincode" id="pincode" value={form.pincode} onChange={handleInput} maxLength={6} required />
                      <p className="mt-1 text-xs">
                        {pincodeStatus === "checking" && "Validating pincode…"}
                        {pincodeStatus === "valid" && <span className="text-emerald-600">{pincodeMessage || "Valid pincode"}</span>}
                        {pincodeStatus === "invalid" && <span className="text-red-600">{pincodeMessage || "Invalid pincode"}</span>}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <select name="state" id="state" value={form.state} onChange={handleInput} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm">
                        <option value="">Select State</option>
                        {STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <select name="city" id="city" value={form.city} onChange={handleInput} disabled={!form.state} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm disabled:opacity-60">
                        <option value="">{form.state ? "Select City" : "Select State First"}</option>
                        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="houseOrFlat">House / Flat *</Label>
                      <Input name="houseOrFlat" id="houseOrFlat" value={form.houseOrFlat} onChange={handleInput} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street / Area *</Label>
                      <Input name="street" id="street" value={form.street} onChange={handleInput} required />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Order Notes (optional)</Label>
                      <Textarea name="notes" id="notes" value={form.notes} onChange={handleInput} rows={2} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to Payment"}
                    </Button>

                    {user && (
                      <Button variant="outline" onClick={() => { setAddingAddress(false); setSelectedAddressIndex(null); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}

              {/* If logged in and a saved address is selected, show a small summary and proceed button */}
              {user && selectedAddressIndex !== null && savedAddresses[selectedAddressIndex] && (
                <div className="mt-4 p-3 rounded-md bg-emerald-50 border border-emerald-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Delivering to:</p>
                      <p className="text-sm">{savedAddresses[selectedAddressIndex].fullName}</p>
                      <p className="text-sm">{savedAddresses[selectedAddressIndex].house}, {savedAddresses[selectedAddressIndex].street}</p>
                      <p className="text-sm">{savedAddresses[selectedAddressIndex].city} - {savedAddresses[selectedAddressIndex].pincode}</p>
                    </div>
                    <div>
                      <Button onClick={handlePlaceOrder} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Proceed to Payment"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.map((item) => {
                  const price = item.product?.weights?.find((w) => w.label === item.weight)?.price || 0;
                  return (
                    <div key={`${item.productId}-${item.weight}`} className="flex items-center space-x-3">
                      <div className="relative w-12 h-12">
                        <Image src={item.product?.image || "/placeholder.svg"} alt={item.product?.name || "Product"} fill className="object-cover rounded" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{item.product?.name || "Product"}</h4>
                        <p className="text-xs text-gray-600">{item.weight} × {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium">₹{price * item.quantity}</div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span className={shipping === 0 ? "text-emerald-600" : ""}>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 space-y-1">
                <p>🔒 Secure checkout with SSL encryption</p>
                <p>💳 Cash on Delivery available</p>
                <p>📞 For help call +91 9359682328</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
