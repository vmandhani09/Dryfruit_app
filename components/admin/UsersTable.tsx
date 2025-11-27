"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Users, UserCheck, Calendar } from "lucide-react"
import { User } from "@/types"

export default function UsersTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users");
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-stone-500">Loading users...</p>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (user) =>
      user.role === "user" &&
      ((user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const now = new Date();
  const userStats = {
    total: users.filter((u) => u.role === "user").length,
    thisMonth: users.filter((u) => {
      const userDate = new Date(u.createdAt);
      return u.role === "user" && userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: users.filter((u) => {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return u.role === "user" && new Date(u.createdAt) >= weekAgo;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-800">User Management</h1>
        <p className="text-stone-600">Manage registered users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">Total Users</p>
                <p className="text-2xl font-bold text-stone-900">{userStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">This Month</p>
                <p className="text-2xl font-bold text-stone-900">{userStats.thisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-stone-600">This Week</p>
                <p className="text-2xl font-bold text-stone-900">{userStats.thisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id.toString()}>
                    <TableCell>
                      <div className="font-medium text-stone-900">{user.name || "No Name"}</div>
                    </TableCell>
                    <TableCell className="text-stone-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-stone-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-stone-500">No users found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}