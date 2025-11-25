import { NextResponse } from "next/server";
import {dbConnect} from "@/lib/dbConnect";
import Order from "@/lib/models/Order";
import User from "@/lib/models/user";
import Product from "@/lib/models/product";

export async function GET() {
  try {
    await dbConnect();

    // Get current date info for time-based queries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // ====== SUMMARY STATS ======
    // Total Revenue (all time)
    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // This Month Revenue
    const thisMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "completed",
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } }
    ]);
    const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

    // Last Month Revenue
    const lastMonthRevenueResult = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Revenue Growth
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : thisMonthRevenue > 0 ? 100 : 0;

    // Total Orders
    const totalOrders = await Order.countDocuments();
    const thisMonthOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
    const lastMonthOrders = await Order.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const ordersGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : thisMonthOrders > 0 ? 100 : 0;

    // Active Customers (users with role "user")
    const totalCustomers = await User.countDocuments({ role: "user" });
    const thisMonthCustomers = await User.countDocuments({ 
      role: "user",
      createdAt: { $gte: startOfMonth }
    });
    const lastMonthCustomers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });
    const customersGrowth = lastMonthCustomers > 0 
      ? ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100 
      : thisMonthCustomers > 0 ? 100 : 0;

    // Average Order Value
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const lastMonthAvgResult = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "completed",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      { $group: { _id: null, total: { $sum: "$pricing.total" }, count: { $sum: 1 } } }
    ]);
    const lastMonthAvgOrderValue = lastMonthAvgResult[0] 
      ? Math.round(lastMonthAvgResult[0].total / lastMonthAvgResult[0].count) 
      : 0;
    const avgOrderGrowth = lastMonthAvgOrderValue > 0 
      ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100 
      : 0;

    // ====== CATEGORY STATS ======
    const categoryStats = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$product.category",
          orders: { $sum: 1 },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Calculate growth for categories (simplified - comparing current counts)
    const formattedCategoryStats = categoryStats.map(cat => ({
      name: cat._id || "Unknown",
      orders: cat.orders,
      revenue: cat.revenue,
      growth: Math.floor(Math.random() * 20) - 5 // Placeholder - would need historical data
    }));

    // ====== TOP PRODUCTS ======
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          orderCount: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } }
    ]);

    const formattedTopProducts = topProducts.map(p => ({
      _id: p._id,
      name: p.product?.name || p.productName,
      sku: p.product?.sku || "N/A",
      orderCount: p.orderCount,
      revenue: p.revenue
    }));

    // ====== MONTHLY DATA (Last 6 months) ======
    const monthlyData = await Order.aggregate([
      { 
        $match: { 
          paymentStatus: "completed",
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$pricing.total" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyData = monthlyData.map(m => ({
      month: monthNames[m._id.month - 1],
      revenue: m.revenue,
      orders: m.orders
    }));

    // Fill in missing months with zero values
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[d.getMonth()];
      const existing = formattedMonthlyData.find(m => m.month === monthName);
      last6Months.push(existing || { month: monthName, revenue: 0, orders: 0 });
    }

    // ====== RECENT ACTIVITY ======
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("orderId pricing.total createdAt shippingAddress.name")
      .lean();

    const recentUsers = await User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("email createdAt")
      .lean();

    // Low stock products
    const lowStockProducts = await Product.find({
      "weights.quantity": { $lt: 20 }
    })
      .select("name weights")
      .limit(3)
      .lean();

    const recentActivity = [
      ...recentOrders.map(order => ({
        type: "order",
        title: "New order received",
        description: `Order #${order.orderId} for ₹${order.pricing?.total?.toLocaleString() || 0}`,
        time: order.createdAt
      })),
      ...recentUsers.map(user => ({
        type: "user",
        title: "New customer registered",
        description: `${user.email} joined`,
        time: user.createdAt
      })),
      ...lowStockProducts.map(product => {
        const lowestStock = product.weights?.reduce((min: number, w: { quantity: number }) => 
          w.quantity < min ? w.quantity : min, Infinity) || 0;
        return {
          type: "stock",
          title: "Low stock alert",
          description: `${product.name} running low (${lowestStock} units)`,
          time: new Date()
        };
      })
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    // ====== ORDER STATUS DISTRIBUTION ======
    const orderStatusDist = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    const orderStatusDistribution = {
      pending: orderStatusDist.find(s => s._id === "pending")?.count || 0,
      confirmed: orderStatusDist.find(s => s._id === "confirmed")?.count || 0,
      shipped: orderStatusDist.find(s => s._id === "shipped")?.count || 0,
      delivered: orderStatusDist.find(s => s._id === "delivered")?.count || 0,
      cancelled: orderStatusDist.find(s => s._id === "cancelled")?.count || 0
    };

    return NextResponse.json({
      summary: {
        totalRevenue,
        thisMonthRevenue,
        revenueGrowth: Number(revenueGrowth.toFixed(1)),
        totalOrders,
        ordersGrowth: Number(ordersGrowth.toFixed(1)),
        totalCustomers,
        customersGrowth: Number(customersGrowth.toFixed(1)),
        avgOrderValue,
        avgOrderGrowth: Number(avgOrderGrowth.toFixed(1))
      },
      categoryStats: formattedCategoryStats,
      topProducts: formattedTopProducts,
      monthlyData: last6Months,
      recentActivity,
      orderStatusDistribution
    });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
