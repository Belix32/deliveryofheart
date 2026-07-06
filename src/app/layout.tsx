import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { GroceryCartProvider } from "@/context/GroceryCartContext";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import MobileNav from "@/components/MobileNav";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Доставка от души",
  description: "Доставка еды с любовью",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <GroceryCartProvider>
              <div className="min-h-screen bg-[#FFF9F5] dark:bg-[#1A1918] text-[#2D2A26] dark:text-[#E8E6E3] transition-colors duration-300">
                <Header />
                <main className="pb-20 md:pb-4">{children}</main>
                <MobileNav />
                <CookieConsent />
              </div>
              </GroceryCartProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}