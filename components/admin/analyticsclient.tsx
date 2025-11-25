"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Target,
  RefreshCw
} from 'lucide-react'
import { Button } from "@/components/ui/button"

interface AnalyticsData {
  summary: {
    totalRevenue: number
    thisMonthRevenue: number
    revenueGrowth: number
    totalOrders: number
    ordersGrowth: number
    totalCustomers: number
    customersGrowth: number
    avgOrderValue: number
    avgOrderGrowth: number
  }
  categoryStats: Array<{
    name: string
    orders: number
    revenue: number
    growth: number
  }>
  topProducts: Array<{
    _id: string
    name: string
    sku: string
    orderCount: number
    revenue: number
  }>
  monthlyData: Array<{
    month: string
    revenue: number
    orders: number
  }>
  recentActivity: Array<{
    type: string
    title: string
    description: string
    time: string
  }>
  orderStatusDistribution: {
    pending: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true)
      const res = await fetch("/api/admin/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const analyticsData = await res.json()
      setData(analyticsData)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      console.error("Failed to load analytics", err)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAnalytics()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchAnalytics(), 30000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">{error || "No data available"}</p>
        <Button onClick={() => fetchAnalytics(true)}>Try Again</Button>
      </div>
    )
  }

  const { summary, categoryStats, topProducts, monthlyData, recentActivity, orderStatusDistribution } = data

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">Analytics Dashboard</h1>
          <p className="text-stone-600">Track your business performance and insights</p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-sm text-stone-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Total Revenue</p>
                <p className="text-2xl font-bold text-stone-900">₹{summary.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {summary.revenueGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{summary.revenueGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">{summary.revenueGrowth}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Total Orders</p>
                <p className="text-2xl font-bold text-stone-900">{summary.totalOrders}</p>
                <div className="flex items-center mt-1">
                  {summary.ordersGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{summary.ordersGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">{summary.ordersGrowth}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Active Customers</p>
                <p className="text-2xl font-bold text-stone-900">{summary.totalCustomers}</p>
                <div className="flex items-center mt-1">
                  {summary.customersGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{summary.customersGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">{summary.customersGrowth}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-stone-900">₹{summary.avgOrderValue.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {summary.avgOrderGrowth >= 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{summary.avgOrderGrowth}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">{summary.avgOrderGrowth}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.length > 0 ? (
                categoryStats.map((category) => {
                  const maxRevenue = Math.max(...categoryStats.map(c => c.revenue), 1)
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-stone-600">₹{category.revenue.toLocaleString()}</span>
                          <Badge
                            variant={category.growth >= 0 ? "default" : "destructive"}
                            className={category.growth >= 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {category.growth >= 0 ? "+" : ""}
                            {category.growth}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(category.revenue / maxRevenue) * 100} className="h-2" />
                      <div className="flex justify-between text-sm text-stone-600">
                        <span>{category.orders} orders</span>
                        <span>{((category.revenue / maxRevenue) * 100).toFixed(1)}% of top category</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-stone-500 text-center py-4">No category data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product._id || index} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-stone-100 rounded-full">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{product.name}</p>
                      <p className="text-sm text-stone-600">{product.orderCount} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-stone-600">Revenue</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-stone-500 text-center py-4">No product data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-4">
              {monthlyData.map((month) => {
                const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1)
                return (
                  <div key={month.month} className="text-center">
                    <div className="bg-emerald-100 h-20 flex items-end justify-center rounded-lg mb-2">
                      <div
                        className="bg-emerald-600 w-8 rounded-t"
                        style={{ height: ((month.revenue / maxRevenue) * 80) + "px" }}
                      />
                    </div>
                    <p className="text-sm font-medium">{month.month}</p>
                    <p className="text-xs text-stone-600">₹{(month.revenue / 1000).toFixed(0)}k</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(orderStatusDistribution).map(([status, count]) => {
                const total = Object.values(orderStatusDistribution).reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((count as number) / total) * 100 : 0
                const colors: Record<string, string> = {
                  pending: "bg-yellow-500",
                  confirmed: "bg-blue-500",
                  shipped: "bg-purple-500",
                  delivered: "bg-green-500",
                  cancelled: "bg-red-500"
                }
                return (
                  <div key={status} className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
                    <span className="capitalize flex-1">{status}</span>
                    <span className="font-medium">{count as number}</span>
                    <span className="text-sm text-stone-500">({percentage.toFixed(1)}%)</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const bgColors: Record<string, string> = {
                    order: "bg-green-50",
                    user: "bg-blue-50",
                    stock: "bg-yellow-50"
                  }
                  const iconBgColors: Record<string, string> = {
                    order: "bg-green-100",
                    user: "bg-blue-100",
                    stock: "bg-yellow-100"
                  }
                  const iconColors: Record<string, string> = {
                    order: "text-green-600",
                    user: "text-blue-600",
                    stock: "text-yellow-600"
                  }
                  return (
                    <div key={index} className={`flex items-center space-x-3 p-3 ${bgColors[activity.type] || "bg-gray-50"} rounded-lg`}>
                      <div className={`${iconBgColors[activity.type] || "bg-gray-100"} p-2 rounded-full`}>
                        {activity.type === "order" && <ShoppingCart className={`h-4 w-4 ${iconColors[activity.type]}`} />}
                        {activity.type === "user" && <Users className={`h-4 w-4 ${iconColors[activity.type]}`} />}
                        {activity.type === "stock" && <Package className={`h-4 w-4 ${iconColors[activity.type]}`} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-stone-600">{activity.description}</p>
                      </div>
                      <div className="text-xs text-stone-500">{formatTimeAgo(activity.time)}</div>
                    </div>
                  )
                })
              ) : (
                <p className="text-stone-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
