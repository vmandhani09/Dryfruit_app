import type { Product, User } from "@/types"

export const users: User[] = [
  {
    _id: "1",
    name: "Priya Sharma",
    email: "priya@example.com",
    password: "password123",
    role: "user",
    mobile: "+91 9359682328",
    createdAt: new Date("2024-01-15"),
    cart: [],
    wishlist: [],
  },
  {
    _id: "2",
    name: "Rajesh Kumar",
    email: "rajesh@example.com",
    password: "password123",
    role: "user",
    mobile: "+91 9876543211",
    createdAt: new Date("2024-01-10"),
    cart: [],
    wishlist: [],
  },
  {
    _id: "3",
    name: "Anita Patel",
    email: "anita@example.com",
    password: "password123",
    role: "user",
    mobile: "+91 9876543212",
    createdAt: new Date("2024-01-05"),
    cart: [],
    wishlist: [],
  },
  {
    _id: "4",
    name: "Admin User",
    email: "admin@DryfruitGrove.com",
    password: "admin123",
    role: "admin",
    mobile: "+91 9876543213",
    createdAt: new Date("2024-01-01"),
    cart: [],
    wishlist: [],
  },
]

export const categories = [
  { id: "nuts", name: "Nuts", icon: "🥜" },
  { id: "dryfruits", name: "Dry Fruits", icon: "🍇" },
  { id: "seeds", name: "Seeds", icon: "🌰" },
  { id: "spices", name: "Spices", icon: "🌶️" },
]

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  shippingAddress: {
    name: string;
    email: string;
    mobile: string;
    address: string;
    city: string;
    pincode: string;
  };
}

export const orders: Order[] = [
  {
    id: "ORD-001",
    userId: "1",
    customerName: "Priya Sharma",
    customerEmail: "priya@example.com",
    items: [
      { productId: "1", productName: "Premium Almonds", weight: "500g", price: 549, quantity: 1 },
      { productId: "2", productName: "Organic Dates", weight: "250g", price: 199, quantity: 2 },
    ],
    total: 947,
    status: "pending",
    shippingAddress: {
      name: "Priya Sharma",
      email: "priya@example.com",
      mobile: "+91 9359682328",
      address: "123 Main Street, Andheri West",
      city: "Mumbai",
      pincode: "400058",
    },
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "ORD-002",
    userId: "2",
    customerName: "Rajesh Kumar",
    customerEmail: "rajesh@example.com",
    items: [
      { productId: "3", productName: "Mixed Seeds", weight: "250g", price: 299, quantity: 1 },
      { productId: "4", productName: "Turmeric Powder", weight: "100g", price: 99, quantity: 1 },
    ],
    total: 398,
    status: "shipped",
    shippingAddress: {
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      mobile: "+91 9876543211",
      address: "456 Park Road, Bandra East",
      city: "Mumbai",
      pincode: "400051",
    },
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "ORD-003",
    userId: "3",
    customerName: "Anita Patel",
    customerEmail: "anita@example.com",
    items: [{ productId: "5", productName: "Cashew Nuts", weight: "500g", price: 749, quantity: 1 }],
    total: 749,
    status: "delivered",
    shippingAddress: {
      name: "Anita Patel",
      email: "anita@example.com",
      mobile: "+91 9876543212",
      address: "789 Hill View, Powai",
      city: "Mumbai",
      pincode: "400076",
    },
    createdAt: new Date("2024-01-05"),
  },
]
