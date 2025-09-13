import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import ClientOnlyWrapper from "@/components/ClientOnlyWrapper"
import "./globals.css"

const geistSans = localFont({
  src: [
    {
      path: "./fonts/Geist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Geist-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Geist-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
})

export const metadata: Metadata = {
  title: "Pofact",
  description:
    "Fast, verifiable access to parliamentary statements, ministerial releases, and government communications",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geistSans.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning={true}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <ClientOnlyWrapper>
          <Analytics />
        </ClientOnlyWrapper>
      </body>
    </html>
  )
}
