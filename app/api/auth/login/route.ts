import { dbConnect } from "@/lib/dbConnect";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🔥 Generate complete JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
      SECRET_KEY,
      { expiresIn: "7d" } // longer session
    );

    // 🔥 Create API response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        addresses: user.addresses || [],
      },
    });

    // 🔥 Set cookie - secure in production
    const isProduction = process.env.NODE_ENV === "production";
    response.cookies.set("token", token, {
      httpOnly: false,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Extra header to force auth refresh
    response.headers.set("X-Auth-Refresh", Date.now().toString());

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
