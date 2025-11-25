import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "@/lib/dbConnect";
import Order from "@/lib/models/Order";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Try to find by orderId first, then by _id
    let order = await Order.findOne({ orderId: id }).lean();
    
    if (!order) {
      order = await Order.findById(id).lean();
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const formattedOrder = {
      _id: (order as any)._id.toString(),
      id: (order as any).orderId,
      customerName: (order as any).shippingAddress?.name || "Unknown",
      customerEmail: (order as any).shippingAddress?.email || "N/A",
      customerMobile: (order as any).shippingAddress?.phone || "N/A",
      items: (order as any).items || [],
      total: (order as any).pricing?.total || 0,
      pricing: (order as any).pricing,
      status: (order as any).orderStatus,
      paymentStatus: (order as any).paymentStatus,
      paymentDetails: (order as any).paymentDetails,
      shippingAddress: (order as any).shippingAddress,
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt,
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error("Admin Order Detail API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const { orderStatus, paymentStatus, notes } = body;

    // Build update object
    const updateData: any = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      updateData["paymentDetails.status"] = paymentStatus;
    }
    if (notes !== undefined) updateData.notes = notes;

    // Try to find and update by orderId first, then by _id
    let order = await Order.findOneAndUpdate(
      { orderId: id },
      { $set: updateData },
      { new: true }
    );

    if (!order) {
      order = await Order.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Order updated successfully",
      order: {
        _id: order._id.toString(),
        id: order.orderId,
        status: order.orderStatus,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Admin Order Update API Error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
