"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LocalUserProvider } from "@/components/LocalUserProvider"; // provides useAuth for client

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current path is admin route
  const isAdminRoute = pathname.startsWith("/admin");
  
  // Check if current path is auth route (login, register, forgot-password)
  const isAuthRoute = pathname.startsWith("/auth") || pathname.startsWith("/forgot-password");

  // Admin or Auth routes: no header/footer, full height
  if (isAdminRoute || isAuthRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  // Client routes: wrap in LocalUserProvider so Header reacts to login/logout
  return (
    <LocalUserProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </LocalUserProvider>
  );
}
