    // app/api/payment/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
const RAZORPAY_BASE = "https://api.razorpay.com/v1/orders";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.warn("Razorpay keys are not set in env.");
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Expect body: { amount, currency, receipt, notes? }
    // amount should be in paise (i.e. rupees * 100)
    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const payload = {
      amount: Math.round(amount), // integer (paise)
      currency: body.currency || "INR",
      receipt: body.receipt || `rcpt_${Date.now()}`,
      payment_capture: body.payment_capture ?? 1, // auto-capture
      notes: body.notes || {},
    };

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
      return NextResponse.json({ error: data.error || "Failed to create order" }, { status: 500 });
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
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
