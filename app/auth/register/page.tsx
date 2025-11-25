"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/userAuth";



type Step = "name" | "email" | "otp" | "password";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();


  const [step, setStep] = useState<Step>("name");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [serverOtp, setServerOtp] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  // field update
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // ---------------------------------------------------
  // STEP-2: EMAIL → CHECK → SEND OTP
  // ---------------------------------------------------
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      //  check email already exists
      const existsRes = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const existsData = await existsRes.json();
      if (existsData.exists) {
        toast.error("Email already registered. Please login.");
        setLoading(false);
        return;
      }

      // send OTP
      const otpRes = await fetch("/api/auth/register-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        toast.error(otpData.error || "Failed to send OTP");
        setLoading(false);
        return;
      }

      setServerOtp(otpData.otp);
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // STEP-3: OTP VERIFICATION
  // ---------------------------------------------------
  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[i] = value.slice(-1);
    setOtp(newOtp);

    if (value && i < 5) otpRefs.current[i + 1]?.focus();

    if (newOtp.every((d) => d !== "")) {
      setTimeout(() => verifyOtp(newOtp.join("")), 80);
    }
  };

  const verifyOtp = (value: string) => {
    if (value !== serverOtp) {
      toast.error("Incorrect OTP");
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
      return;
    }
    toast.success("Email verified!");
    setStep("password");
  };

  // ---------------------------------------------------
  // STEP-4: PASSWORD + CREATE ACCOUNT
  // ---------------------------------------------------
  const validatePassword = (pass: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$/;
    return regex.test(pass);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) {
      toast.error(
        "Password must be 8-20 chars, include 1 uppercase, 1 lowercase, 1 number and 1 special character."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
        }),
      });

      const data = await res.json();

if (!res.ok) {
  toast.error(data.error || "Registration failed");
  setLoading(false);
  return;
}

// 🔥 AUTO-LOGIN
localStorage.setItem("userToken", data.token);
const isSecure = window.location.protocol === "https:";
const cookieString = `token=${data.token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 7}${isSecure ? "; Secure" : ""}`;
document.cookie = cookieString;

setUser(data.user);

// 🔥 REDIRECT if user came from checkout
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get("redirect") || "/";

toast.success("Account created! Logging you in...");
router.push(redirectPath);

return;

      

      toast.success("Account created!");
      router.push("/auth/login?verified=true");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // UI BLOCKS
  // ---------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl font-semibold">
              {step === "name" && "Create Account"}
              {step === "email" && "Enter Email"}
              {step === "otp" && "Verify OTP"}
              {step === "password" && "Set Password"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* STEP-1: NAME */}
            {step === "name" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStep("email");
                }}
                className="space-y-6"
              >
                <div>
                  <Label>First Name</Label>
                  <Input
                    name="firstName"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input
                    name="lastName"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Next
                </Button>
              </form>
            )}

            {/* STEP-2: EMAIL */}
            {step === "email" && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <Label>Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            )}

            {/* STEP-3: OTP */}
            {step === "otp" && (
              <div className="space-y-6">
                <p className="text-center text-sm text-gray-700">
                  Enter the 6-digit OTP sent to <b>{formData.email}</b>
                </p>

                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <Input
                      key={i}
                      ref={(el: HTMLInputElement | null) => {otpRefs.current[i] = el;
}}

                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-12 text-center text-xl font-semibold"
                    />
                  ))}
                </div>

                <button
                  className="text-sm text-emerald-600 underline block text-center"
                  onClick={() => setStep("email")}
                >
                  Change Email
                </button>
              </div>
            )}

            {/* STEP-4: PASSWORD */}
            {step === "password" && (
              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div>
                  <Label>Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 text-gray-400"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <p className="text-xs text-gray-600">
                  Password must be <b>8-20 characters</b>, include at least{" "}
                  <b>1 uppercase</b>, <b>1 lowercase</b>, <b>1 number</b>, and{" "}
                  <b>1 special character</b>.
                </p>

                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? "Creating..." : "Create Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
