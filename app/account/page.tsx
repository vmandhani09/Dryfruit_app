"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Edit, Save, Trash2, LogOut, Package, Key } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/hooks/userAuth";
import { STATES, fetchCitiesByState, validatePincode } from "@/lib/indiaData";

type AddressForm = {
  fullName: string;
  phone: string;
  pincode: string;
  house: string;
  street: string;
  landmark?: string;
  state: string;
  city: string;
  isDefault?: boolean;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  addresses?: AddressForm[];
};

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  pincode: "",
  house: "",
  street: "",
  landmark: "",
  state: "",
  city: "",
  isDefault: false,
};

const TOKEN_KEY = "userToken";

export default function AccountPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isLoading: isAuthLoading } = useAuth();

  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "orders" | "password">("profile");

  // Profile
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileName, setProfileName] = useState("");

  // Addresses
  const [addresses, setAddresses] = useState<AddressForm[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [cities, setCities] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  // Orders
  const [orders, setOrders] = useState<any[] | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Change password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // sync auth -> localUser
  useEffect(() => {
    if (user) {
      setLocalUser(user as UserData);
      setProfileName((user as UserData).name || "");
      setAddresses((user as UserData).addresses || []);
    } else {
      setLocalUser(null);
      setAddresses([]);
    }
  }, [user]);

  // helper to get token
  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);

  // refresh /api/auth/me
  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setLocalUser(null);
      setUser(null);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        setLocalUser(null);
        setUser(null);
        return;
      }
      const data = await res.json();
      setLocalUser(data.user);
      setUser(data.user);
      setAddresses(data.user.addresses || []);
    } catch (err) {
      console.error("refreshUser error:", err);
    }
  };

  // -------------------------
  // Profile Save
  // -------------------------
  const handleSaveProfileName = async () => {
    const name = profileName.trim();
    if (name.length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }
    const token = getToken();
    if (!token) {
      toast.error("Please login again");
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }
      toast.success("Profile updated");
      setIsEditingName(false);
      await refreshUser();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    }
  };

  // -------------------------
  // Address helpers
  // -------------------------
  const startAddAddress = () => {
    setEditingIndex(null);
    setAddressForm({ ...EMPTY_ADDRESS });
    setCities([]);
    setPincodeStatus("idle");
    setActiveTab("addresses");
    setIsSubmittingAddress(false);
    setTimeout(() => {
      const el = document.getElementById("fullName");
      el?.focus();
    }, 100);
  };

  const startEditAddress = (idx: number) => {
    const a = addresses[idx];
    setEditingIndex(idx);
    setAddressForm({ ...a });
    if (a.state) {
      fetchCitiesByState(a.state).then((list) => setCities(list || []));
    } else {
      setCities([]);
    }
    setPincodeStatus(a.pincode ? "valid" : "idle");
    setActiveTab("addresses");
  };

  const handleAddressChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setAddressForm((p) => ({ ...p, phone: digits }));
      return;
    }
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setAddressForm((p) => ({ ...p, pincode: digits }));
      setPincodeStatus("idle");
      if (digits.length === 6) {
        setPincodeStatus("checking");
        try {
          const res = await validatePincode(digits);
          if (res.valid) {
            setPincodeStatus("valid");
            toast.success("Pincode looks valid");
          } else {
            setPincodeStatus("invalid");
            toast.error("Invalid pincode");
          }
        } catch {
          setPincodeStatus("invalid");
          toast.error("Could not validate pincode");
        }
      }
      return;
    }
    if (name === "state") {
      setAddressForm((p) => ({ ...p, state: value, city: "" }));
      setCities([]);
      if (value) {
        const list = await fetchCitiesByState(value);
        setCities(list || []);
      }
      return;
    }
    setAddressForm((p) => ({ ...p, [name]: value }));
  };

  const validateAddressForm = async (form: AddressForm) => {
    if (!form.fullName?.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone || "")) {
      toast.error("Phone must be 10 digits and start with 6-9");
      return false;
    }
    if (!/^\d{6}$/.test(form.pincode || "")) {
      toast.error("Pincode must be 6 digits");
      return false;
    }
    if (!form.house?.trim()) {
      toast.error("House / Flat is required");
      return false;
    }
    if (!form.street?.trim()) {
      toast.error("Street / Area is required");
      return false;
    }
    if (!form.state) {
      toast.error("Please select a state");
      return false;
    }
    if (!form.city) {
      toast.error("Please select a city");
      return false;
    }
    // optionally re-validate pincode with API if status invalid
    if (pincodeStatus !== "valid") {
      try {
        const res = await validatePincode(form.pincode || "");
        if (!res.valid) {
          toast.error("Please supply a valid pincode");
          return false;
        }
      } catch {
        // ignore – allow submission if other checks pass
      }
    }
    return true;
  };

  const submitAddress = async () => {
    const token = getToken();
    if (!token) {
      toast.error("Session expired — please login");
      router.push("/auth/login");
      return;
    }

    const ok = await validateAddressForm(addressForm);
    if (!ok) return;

    setIsSubmittingAddress(true);
    try {
      // If editingIndex is null => add new address (POST)
      // If editingIndex !== null => update existing address (PUT with index)
      const endpoint = editingIndex === null ? "/api/user/address/save" : "/api/user/address/update";
      const method = editingIndex === null ? "POST" : "PUT";
      const body = editingIndex === null ? addressForm : { index: editingIndex, address: addressForm };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save address");
        return;
      }

      // Expect server to return updated addresses; if not, refresh
      if (data?.addresses) {
        setAddresses(data.addresses);
      } else {
        await refreshUser();
      }

      toast.success(editingIndex === null ? "Address added" : "Address updated");
      setEditingIndex(null);
      setAddressForm(EMPTY_ADDRESS);
    } catch (err) {
      console.error("submitAddress error:", err);
      toast.error("Could not save address");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  // open delete modal
  const confirmDeleteAddress = (idx: number) => {
    setDeleteIndex(idx);
    setShowDeleteModal(true);
  };

  const deleteAddress = async () => {
    if (deleteIndex === null) return setShowDeleteModal(false);
    const idx = deleteIndex;
    setShowDeleteModal(false);
    const token = getToken();
    if (!token) {
      toast.error("Please login");
      router.push("/auth/login");
      return;
    }
    try {
      const res = await fetch("/api/user/address/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ index: idx }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete address");
        return;
      }
      // server should return updated addresses
      if (data?.addresses) {
        setAddresses(data.addresses);
      } else {
        await refreshUser();
      }
      toast.success("Address removed");
    } catch (err) {
      console.error("deleteAddress error:", err);
      toast.error("Could not delete address");
    }
  };

  // -------------------------
  // Orders
  // -------------------------
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const token = getToken();
      if (!token) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("loadOrders", err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // -------------------------
  // Change password
  // -------------------------
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error("Please login");
      router.push("/auth/login");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password");
        return;
      }
      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("change-password error:", err);
      toast.error("Could not change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // -------------------------
  // Logout
  // -------------------------
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    setUser(null);
    router.push("/");
  };

  // -------------------------
  // Render
  // -------------------------
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!localUser) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No user session found.</p>
            <Button className="mt-4" onClick={() => router.push("/auth/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">My Account</h1>
      <p className="text-muted-foreground mb-6">Manage profile, addresses, orders and security settings.</p>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 gap-2">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center space-x-2">
            <span>Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>Change Password</span>
          </TabsTrigger>
        </TabsList>

        {/* PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              {!isEditingName ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSaveProfileName}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setIsEditingName(false); setProfileName(localUser.name); }}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full name</Label>
                <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} disabled={!isEditingName} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={localUser.email} disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADDRESSES */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Saved Addresses</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={startAddAddress}>
                  Add Address
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* list addresses */}
              <div className="space-y-4">
                {addresses.length === 0 && (
                  <div className="rounded border border-gray-200 p-4 text-sm text-muted-foreground">
                    No saved addresses — add one for faster checkout.
                  </div>
                )}

                {addresses.map((a, idx) => (
                  <div key={idx} className="rounded border border-gray-200 p-4 flex justify-between items-start">
                    <div>
                      <p className="font-medium">{a.fullName} {a.isDefault ? <span className="text-xs text-emerald-600 ml-2">Default</span> : null}</p>
                      <p className="text-sm text-muted-foreground">{a.phone}</p>
                      <p className="mt-2 text-sm">{a.house}, {a.street}</p>
                      <p className="text-sm">{a.city} - {a.pincode}, {a.state}</p>
                      {a.landmark && <p className="text-sm text-muted-foreground">Landmark: {a.landmark}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditAddress(idx)}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => confirmDeleteAddress(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* address form (add / edit) */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">{editingIndex === null ? "Add Address" : "Edit Address"}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" name="fullName" value={addressForm.fullName} onChange={handleAddressChange} />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" value={addressForm.phone} onChange={handleAddressChange} maxLength={10} placeholder="10-digit mobile" />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <select
                      id="state"
                      name="state"
                      value={addressForm.state}
                      onChange={handleAddressChange}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
                    >
                      <option value="">Select State</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <select
                      id="city"
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressChange}
                      disabled={!addressForm.state}
                      className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500"
                    >
                      <option value="">{addressForm.state ? "Select City" : "Select State First"}</option>
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input id="pincode" name="pincode" value={addressForm.pincode} onChange={handleAddressChange} maxLength={6} />
                    <p className="text-xs mt-1">
                      {pincodeStatus === "checking" && "Validating pincode…"}
                      {pincodeStatus === "valid" && <span className="text-emerald-600">Valid pincode</span>}
                      {pincodeStatus === "invalid" && <span className="text-red-600">Invalid pincode</span>}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="house">House / Flat</Label>
                    <Input id="house" name="house" value={addressForm.house} onChange={handleAddressChange} />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="street">Street / Area</Label>
                    <Input id="street" name="street" value={addressForm.street} onChange={handleAddressChange} />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="landmark">Landmark (optional)</Label>
                    <Input id="landmark" name="landmark" value={addressForm.landmark} onChange={handleAddressChange as any} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={submitAddress} disabled={isSubmittingAddress}>
                    {isSubmittingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {editingIndex === null ? "Save Address" : "Update Address"}
                  </Button>
                  <Button variant="outline" onClick={() => { setEditingIndex(null); setAddressForm(EMPTY_ADDRESS); setCities([]); setPincodeStatus("idle"); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((o) => {
                    const statusColors: Record<string, string> = {
                      pending: "bg-yellow-100 text-yellow-800",
                      confirmed: "bg-blue-100 text-blue-800",
                      shipped: "bg-purple-100 text-purple-800",
                      delivered: "bg-green-100 text-green-800",
                      cancelled: "bg-red-100 text-red-800",
                    };
                    const paymentColors: Record<string, string> = {
                      completed: "bg-emerald-100 text-emerald-800",
                      pending: "bg-yellow-100 text-yellow-800",
                      failed: "bg-red-100 text-red-800",
                    };
                    return (
                      <div
                        key={o._id || o.orderId}
                        className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/order-confirmation/${o._id || o.orderId}`)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm font-mono">
                                {o.orderId || o._id}
                              </p>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.orderStatus] || "bg-gray-100 text-gray-800"}`}>
                                {o.orderStatus?.charAt(0).toUpperCase() + o.orderStatus?.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              at{" "}
                              {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            {o.items && o.items.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {o.items.length} item{o.items.length > 1 ? "s" : ""} •{" "}
                                {o.items.slice(0, 2).map((item: any) => item.productName).join(", ")}
                                {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex flex-col justify-between">
                            <p className="font-bold text-lg text-emerald-600">
                              ₹{o.pricing?.total ?? "—"}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-block mt-1 ${paymentColors[o.paymentStatus] || "bg-gray-100 text-gray-800"}`}>
                              {o.paymentStatus === "completed" ? "Paid" : o.paymentStatus}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Delivery to: {o.shippingAddress?.city || "N/A"}
                          </p>
                          <Button variant="ghost" size="sm" className="text-emerald-600 h-7 text-xs">
                            View Details →
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded border border-gray-200 p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-muted-foreground mb-4">You have no orders yet.</p>
                  <Button onClick={() => router.push("/shop")}>
                    Start Shopping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHANGE PASSWORD */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Old Password</Label>
                <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
              </div>

              <div className="md:col-span-2 flex gap-3 justify-start mt-2">
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
                <Button variant="outline" onClick={() => { setOldPassword(""); setNewPassword(""); setConfirmNewPassword(""); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
          <div className="bg-white rounded-lg shadow-lg z-10 w-11/12 max-w-md p-6">
            <h3 className="text-lg font-medium mb-2">Delete address</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this address? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={deleteAddress}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
