import { NextRequest, NextResponse } from "next/server";
import {dbConnect} from "@/lib/dbConnect";
import Order from "@/lib/models/Order";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const query: any = {};

    if (status && status !== "all") {
      query.orderStatus = status;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "shippingAddress.name": { $regex: search, $options: "i" } },
        { "shippingAddress.email": { $regex: search, $options: "i" } },
      ];
    }

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Fetch orders with pagination
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get stats for all statuses
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const orderStats = {
      total: await Order.countDocuments(),
      pending: stats.find((s) => s._id === "pending")?.count || 0,
      confirmed: stats.find((s) => s._id === "confirmed")?.count || 0,
      shipped: stats.find((s) => s._id === "shipped")?.count || 0,
      delivered: stats.find((s) => s._id === "delivered")?.count || 0,
      cancelled: stats.find((s) => s._id === "cancelled")?.count || 0,
    };

    // Format orders for frontend
    const formattedOrders = orders.map((order: any) => ({
      _id: order._id.toString(),
      id: order.orderId,
      customerName: order.shippingAddress?.name || "Unknown",
      customerEmail: order.shippingAddress?.email || "N/A",
      customerMobile: order.shippingAddress?.phone || "N/A",
      items: order.items || [],
      total: order.pricing?.total || 0,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      stats: orderStats,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    console.error("Admin Orders API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
