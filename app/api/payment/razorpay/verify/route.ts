// app/api/payment/razorpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/lib/models/Order";
import jwt from "jsonwebtoken";
import { sendEmail, getOrderConfirmationEmailTemplate } from "@/lib/sendEmail";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    /**
     expected body:
     {
       razorpay_payment_id,
       razorpay_order_id,
       razorpay_signature,
       orderPayload: {
         items, shippingAddress, pricing, paymentMethod
       },
       token? (optional) - if client included auth token
     }
    */
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderPayload, token } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !orderPayload) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!KEY_SECRET) {
      console.error("RAZORPAY_KEY_SECRET not set");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Verify signature: hmac_sha256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("Razorpay signature mismatch", { expected, received: razorpay_signature });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // signature valid -> save order to DB
    const orderDoc = {
      orderId: razorpay_order_id,
      userId: null as any,
      items: orderPayload.items,
      shippingAddress: orderPayload.shippingAddress,
      pricing: orderPayload.pricing,
      paymentDetails: {
        method: orderPayload.paymentMethod || "razorpay",
        transactionId: razorpay_payment_id,
        status: "completed",
      },
      orderStatus: "confirmed",
      paymentStatus: "completed",
    };

    // If token present and valid, attach userId
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded?.userId) {
          orderDoc.userId = decoded.userId;
        }
      } catch (e) {
        // token invalid -> ignore, still allow guest order
      }
    }

    const saved = await Order.create(orderDoc);

    // Send order confirmation email
    try {
      const emailData = {
        orderId: saved.orderId || saved._id.toString(),
        customerName: orderPayload.shippingAddress?.name || "Customer",
        email: orderPayload.shippingAddress?.email || "",
        phone: orderPayload.shippingAddress?.phone || "",
        items: orderPayload.items.map((item: any) => ({
          productName: item.productName,
          weight: item.weight,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: {
          address1: orderPayload.shippingAddress?.address1 || "",
          address2: orderPayload.shippingAddress?.address2,
          city: orderPayload.shippingAddress?.city || "",
          state: orderPayload.shippingAddress?.state,
          zip: orderPayload.shippingAddress?.zip || "",
        },
        pricing: orderPayload.pricing,
        paymentMethod: "Razorpay",
        transactionId: razorpay_payment_id,
        orderDate: new Date(),
      };

      if (emailData.email) {
        const emailHtml = getOrderConfirmationEmailTemplate(emailData);
        await sendEmail(
          emailData.email,
          `Order Confirmed - ${emailData.orderId} | Dryfruit Grove`,
          emailHtml
        );
        console.log("Order confirmation email sent to:", emailData.email);
      }
    } catch (emailErr) {
      // Log but don't fail the order if email fails
      console.error("Failed to send order confirmation email:", emailErr);
    }

    return NextResponse.json({ verified: true, success: true, order: saved, orderId: saved._id });
  } catch (err) {
    console.error("verify-order error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
