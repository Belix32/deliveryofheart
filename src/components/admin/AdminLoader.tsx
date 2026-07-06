"use client";

import { Loader2 } from "lucide-react";

export default function AdminLoader({ className = "min-h-[50vh]" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
