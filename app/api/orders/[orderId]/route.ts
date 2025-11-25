import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Order from "@/lib/models/Order";
import { dbConnect } from "@/lib/dbConnect";

const SECRET_KEY = process.env.JWT_SECRET || "default-secret-key";

// GET - Fetch a single order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await dbConnect();

    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Try to find by MongoDB _id first, then by orderId field
    let order;
    
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      order = await Order.findById(orderId).lean();
    }
    
    if (!order) {
      order = await Order.findOne({ orderId }).lean();
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Optionally verify ownership if user is logged in
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        const userId = decoded.userId;
        
        // If order has userId and it doesn't match, still return order
        // but you could restrict this if needed
        // For now, we allow viewing any order if you have the ID (like a receipt)
      } catch (err) {
        // Token invalid, but still allow viewing order
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
