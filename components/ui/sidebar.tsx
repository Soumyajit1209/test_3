import React from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        Assistant
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function SidebarItem({ icon, label, isActive, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left",
        isActive ? "bg-white text-black" : "bg-gray-700 text-white hover:bg-gray-600"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
