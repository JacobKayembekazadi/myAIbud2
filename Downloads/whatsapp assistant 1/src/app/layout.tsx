import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { TenantProvider } from "@/components/TenantProvider";
import { SidebarProvider } from "@/components/SidebarContext";
import { Sidebar } from "@/components/Sidebar";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ToasterClient } from "@/components/ToasterClient";
import { LayoutContent } from "@/components/LayoutContent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Aibud",
  description: "AI Real Estate Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950`}>
        <ConvexClientProvider>
          <SignedIn>
            <TenantProvider>
              <SidebarProvider>
                <div className="flex min-h-screen">
                  <Sidebar />
                  <LayoutContent>{children}</LayoutContent>
                </div>
              </SidebarProvider>
            </TenantProvider>
          </SignedIn>
          <SignedOut>
            {children}
          </SignedOut>
        </ConvexClientProvider>
        <ToasterClient />
      </body>
    </html>
  );
}
