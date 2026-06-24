"use client";

import BottomNav from "@/components/courier/BottomNav";

export default function CourierShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A09]">
      {children}
      <BottomNav />
    </div>
  );
}
