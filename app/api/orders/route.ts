import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Order from "@/lib/models/Order";
import crypto from "crypto";
import { dbConnect } from "@/lib/dbConnect";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

// GET - Fetch user's orders
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Read JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        userId = decoded.userId;
      } catch (err) {
        console.error("JWT error:", err);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    // Read JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        userId = decoded.userId;
      } catch (err) {
        console.error("JWT error:", err);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // If not logged in, userId will be null (guest order)

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!body.pricing || !body.pricing.total || body.pricing.total < 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    if (!body.paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required" },
        { status: 400 }
      );
    }

    if (!body.shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    const orderId = `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const createdOrder = await Order.create({
      orderId,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      items: body.items.map((item: any) => ({
        productId: new mongoose.Types.ObjectId(item.productId),
        productName: item.productName,
        weight: item.weight,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: body.shippingAddress,
      pricing: body.pricing,
      paymentDetails: { method: body.paymentMethod, status: "pending" },
      orderStatus: "pending",
      paymentStatus: "pending",
    });

    return NextResponse.json(
      {
        message: "Order placed successfully",
        orderId: createdOrder.orderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
