import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import CartItem from "@/lib/models/cartItem";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

// POST: Deduplicate cart items for the logged-in user
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get userId from JWT
    const authHeader = req.headers.get("authorization");
    let userId = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = jwt.verify(token, SECRET_KEY) as any;
        userId = decoded.userId;
      } catch (err) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No userId" }, { status: 401 });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all cart items for this user
    const cartItems = await CartItem.find({ userId: userObjectId });

    // Group by productId + weight
    const grouped: Record<string, { items: any[]; totalQuantity: number }> = {};

    for (const item of cartItems) {
      const key = `${item.productId.toString()}-${item.weight}`;
      if (!grouped[key]) {
        grouped[key] = { items: [], totalQuantity: 0 };
      }
      grouped[key].items.push(item);
      grouped[key].totalQuantity += item.quantity;
    }

    // For each group with duplicates, keep one and delete the rest
    let deletedCount = 0;
    for (const key in grouped) {
      const group = grouped[key];
      if (group.items.length > 1) {
        // Keep the first item and update its quantity
        const keepItem = group.items[0];
        keepItem.quantity = group.totalQuantity;
        await keepItem.save();

        // Delete the rest
        for (let i = 1; i < group.items.length; i++) {
          await CartItem.findByIdAndDelete(group.items[i]._id);
          deletedCount++;
        }
      }
    }

    return NextResponse.json({ 
      message: "Cart deduplicated successfully",
      deletedCount 
    });
  } catch (error) {
    console.error("Error deduplicating cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
