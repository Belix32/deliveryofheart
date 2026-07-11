"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ShoppingBasket, User, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { useGroceryCart } from "@/context/GroceryCartContext";

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { items } = useCart();
  const { items: groceryItems } = useGroceryCart();
  const pathname = usePathname();

  const foodCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const groceryCount = groceryItems.length;
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#FFF9F5]/80 dark:bg-[#1A1918]/80 backdrop-blur-md border-b border-[#F5F3F0] dark:border-[#2D2A26]">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl md:text-3xl font-display font-bold text-primary dark:text-primary-dark">
              ДУШИ
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[#F5F3F0] dark:hover:bg-[#2D2A26] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-primary-dark" />
              ) : (
                <Moon className="w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3]" />
              )}
            </button>

            <Link
              href="/grocery/cart"
              className="relative p-2 rounded-full hover:bg-[#F5F3F0] dark:hover:bg-[#2D2A26] transition-colors"
              title="Корзина продуктов"
            >
              <ShoppingBasket className="w-5 h-5 text-emerald-600" />
              {groceryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {groceryCount > 99 ? "99+" : groceryCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative p-2 rounded-full hover:bg-[#F5F3F0] dark:hover:bg-[#2D2A26] transition-colors"
              title="Корзина еды"
            >
              <ShoppingCart className="w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3]" />
              {foodCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary dark:bg-secondary-dark text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {foodCount > 999 ? "999+" : foodCount}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              className={`p-2 rounded-full transition-colors ${
                isActive("/profile")
                  ? "bg-primary/10 dark:bg-primary-dark/10"
                  : "hover:bg-[#F5F3F0] dark:hover:bg-[#2D2A26]"
              }`}
            >
              <User className="w-5 h-5 text-[#2D2A26] dark:text-[#E8E6E3]" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
