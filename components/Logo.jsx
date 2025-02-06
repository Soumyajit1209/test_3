"use client";

import { cn } from "@/lib/utils";

export function Logo({ className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 bg-white rounded-lg"></div>
        <div className="absolute inset-0 flex items-center justify-center text-background font-bold text-2xl ">
          a
        </div>
      </div>
      <span className="text-3xl font-extrabold tracking-tight">azmth</span>
    </div>
  );
}