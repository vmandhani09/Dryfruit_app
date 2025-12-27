import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Package, ShoppingCart, TrendingUp, TrendingDown, DollarSign, AlertCircle, Plus } from 'lucide-react'
import Product from "@/lib/models/product"
import User from "@/lib/models/user"
import Order from "@/lib/models/Order"
import { dbConnect } from "@/lib/dbConnect"
import { requireAdmin } from "@/lib/admin-auth"

async function getDashboardStats() {
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // User stats
  const totalUsers = await User.countDocuments({ role: "user" });
  const thisMonthUsers = await User.countDocuments({ 
    role: "user", 
    createdAt: { $gte: startOfMonth } 
  });
  const lastMonthUsers = await User.countDocuments({ 
    role: "user", 
    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
  });
  const usersGrowth = lastMonthUsers > 0 
    ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) 
    : thisMonthUsers > 0 ? 100 : 0;

  // Product stats
  const products = await Product.find({}).lean();
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: any) => {
    const minStock = p.weights?.reduce((min: number, w: any) => 
      w.quantity < min ? w.quantity : min, Infinity) || 0;
    return minStock < 20;
  }).length;

  // Order stats
  const totalOrders = await Order.countDocuments();
  const thisMonthOrders = await Order.countDocuments({ createdAt: { $gte: startOfMonth } });
  const lastMonthOrders = await Order.countDocuments({ 
    createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
  });
  const ordersGrowth = lastMonthOrders > 0 
    ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) 
    : thisMonthOrders > 0 ? 100 : 0;

  const pendingOrders = await Order.countDocuments({ orderStatus: "pending" });

  // Revenue stats
  const totalRevenueResult = await Order.aggregate([
    { $match: { paymentStatus: "completed" } },
    { $group: { _id: null, total: { $sum: "$pricing.total" } } }
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;

  const thisMonthRevenueResult = await Order.aggregate([
    { $match: { paymentStatus: "completed", createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$pricing.total" } } }
  ]);
  const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0;

  const lastMonthRevenueResult = await Order.aggregate([
    { $match: { paymentStatus: "completed", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
    { $group: { _id: null, total: { $sum: "$pricing.total" } } }
  ]);
  const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
  const revenueGrowth = lastMonthRevenue > 0 
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
    : thisMonthRevenue > 0 ? 100 : 0;

  // Recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(4)
    .select("orderId shippingAddress pricing orderStatus createdAt")
    .lean();

  // Category stats
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
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 4 }
  ]);

  const totalCategoryRevenue = categoryStats.reduce((sum, cat) => sum + cat.revenue, 0) || 1;
  const formattedCategoryStats = categoryStats.map(cat => ({
    name: cat._id || "Unknown",
    percentage: Math.round((cat.revenue / totalCategoryRevenue) * 100)
  }));

  return {
    totalUsers,
    usersGrowth,
    totalProducts,
    lowStockProducts,
    totalOrders,
    ordersGrowth,
    pendingOrders,
    totalRevenue,
    revenueGrowth,
    recentOrders: recentOrders.map((order: any) => ({
      id: order.orderId,
      customer: order.shippingAddress?.name || "Unknown",
      amount: order.pricing?.total || 0,
      status: order.orderStatus
    })),
    categoryStats: formattedCategoryStats
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();

  const stats = await getDashboardStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Dryfruit Grove Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <div className="flex items-center mt-1">
                  {stats.usersGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.usersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.usersGrowth >= 0 ? '+' : ''}{stats.usersGrowth}% this month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-emerald-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                {stats.lowStockProducts > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.lowStockProducts} low stock
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <div className="flex items-center mt-1">
                  {stats.ordersGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.ordersGrowth >= 0 ? '+' : ''}{stats.ordersGrowth}% this month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                  <span className="test-green-500">
                    INR
                  </span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {stats.revenueGrowth >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% this month
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/admin/products">
          <Button className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <Package className="h-6 w-6" />
            <span className="text-sm font-medium">Manage Products</span>
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-sm font-medium">View Orders</span>
          </Button>
        </Link>
        <Link href="/admin/products/add">
          <Button className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50">
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add Product</span>
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button className="w-full h-16 flex flex-col items-center justify-center space-y-1 bg-white border-2 border-yellow-200 text-yellow-700 hover:bg-yellow-50">
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium">Manage Users</span>
          </Button>
        </Link>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders/${order.id}`}>
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium font-mono">{order.id}</p>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{order.amount.toLocaleString()}</p>
                        <Badge className={getStatusColor(order.status)}>{order.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm font-medium text-orange-800">Low Stock Alert</p>
              <p className="text-sm text-orange-600">{stats.lowStockProducts} products running low</p>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">Pending Orders</p>
              <p className="text-sm text-yellow-600">{stats.pendingOrders} orders need attention</p>
            </div>

            <div className={`p-3 ${stats.revenueGrowth >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg`}>
              <p className={`text-sm font-medium ${stats.revenueGrowth >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                Revenue {stats.revenueGrowth >= 0 ? 'Growth' : 'Decline'}
              </p>
              <p className={`text-sm ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}% this month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.categoryStats.length > 0 ? (
              <div className="space-y-3">
                {stats.categoryStats.map((category) => (
                  <div key={category.name} className="flex justify-between">
                    <span className="text-sm">{category.name}</span>
                    <span className="text-sm font-medium">{category.percentage}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No category data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                {stats.ordersGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className="text-sm">Orders: {stats.ordersGrowth >= 0 ? '+' : ''}{stats.ordersGrowth}%</span>
              </div>
              <div className="flex items-center">
                {stats.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className="text-sm">Revenue: {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth}%</span>
              </div>
              <div className="flex items-center">
                {stats.usersGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className="text-sm">New Users: {stats.usersGrowth >= 0 ? '+' : ''}{stats.usersGrowth}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm">Website Status: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm">Payment Gateway: Active</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm">Database: Connected</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
