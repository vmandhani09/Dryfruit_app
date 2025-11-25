
import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalLayout } from "@/components/layout/conditional-layout"
import { AuthProvider } from "@/hooks/userAuth";
import "./globals.css"
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' })

export const metadata: Metadata = {
  title: "Dryfruit Grove — Premium Dry Fruits & Spices",
  description:
    "Premium dry fruits, nuts, seeds, and spices sourced from the finest farms. Discover freshness and flavor.",
  keywords: "dry fruits, nuts, seeds, spices, organic, premium, healthy",
  generator: 'v0.dev',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable}`}>
          <Toaster richColors position="top-center" />
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <AuthProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            </AuthProvider>
          </ThemeProvider>
        
      </body>
    </html>
  )
}
