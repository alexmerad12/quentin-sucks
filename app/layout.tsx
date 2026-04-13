import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/lib/storage";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Quentin Sucks",
  description: "Workout tracker for the boys",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d0d0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full font-sans" style={{ backgroundColor: "#0d0d0d", color: "#f2f2f2" }}>
        <AppProvider>
          <main className="mx-auto max-w-lg pb-24 pt-2">{children}</main>
          <NavBar />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#fff",
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
