import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { Providers } from "@/components/providers"
import Header from "@/components/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Feature Request System",
  description: "Submit and vote on feature requests",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <AuthProvider>
            <Providers>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
                <footer className="py-6 border-t">
                  <div className="container mx-auto px-4 text-center text-muted-foreground">
                    © {new Date().getFullYear()} Feature Request System
                  </div>
                </footer>
              </div>
              <Toaster />
            </Providers>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'