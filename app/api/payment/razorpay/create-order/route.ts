// app/api/payment/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";

const RAZORPAY_BASE = "https://api.razorpay.com/v1/orders";

export async function POST(req: NextRequest) {
  try {
    const KEY_ID = process.env.RAZORPAY_KEY_ID;
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!KEY_ID || !KEY_SECRET) {
      console.error("Razorpay keys are not set in env.");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    await dbConnect();
    const body = await req.json();

    // Expect body: { amount, currency, receipt, notes? }
    // amount should be in paise (i.e. rupees * 100)
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Razorpay minimum amount is 100 paise (₹1)
    if (amount < 100) {
      return NextResponse.json({ error: "Minimum order amount is ₹1" }, { status: 400 });
    }

    const payload = {
      amount: Math.round(amount), // integer (paise)
      currency: body.currency || "INR",
      receipt: body.receipt || `rcpt_${Date.now()}`,
      payment_capture: body.payment_capture ?? 1, // auto-capture
      notes: body.notes || {},
    };

    console.log("Creating Razorpay order with payload:", payload);

    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

    const r = await fetch(RAZORPAY_BASE, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("Razorpay create-order failed", data);
      // Extract error message properly
      const errorMsg = typeof data.error === 'object' 
        ? data.error?.description || data.error?.code || "Failed to create order"
        : data.error || "Failed to create order";
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    // return razorpay order object to client with keyId
    return NextResponse.json({ 
      success: true, 
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: KEY_ID,
      order: data 
    });
  } catch (err: any) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
