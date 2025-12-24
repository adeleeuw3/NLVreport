import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina BI",
  description: "Next Gen Business Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          {/* Ambient Background Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-[80px] animate-float delay-0 mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-red-200/40 rounded-full blur-[80px] animate-float delay-1000 mix-blend-multiply"></div>
          <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-yellow-200/30 rounded-full blur-[60px] animate-float delay-2000 mix-blend-multiply"></div>
        </div>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
