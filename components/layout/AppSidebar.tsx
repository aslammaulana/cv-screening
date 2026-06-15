"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboard3Line,
  RiAwardLine,
  RiGroupLine,
  RiSettings3Line,
  RiFileTextLine,
} from "react-icons/ri";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: RiDashboard3Line },
  { href: "/dashboard/qualification", label: "Qualifications", icon: RiAwardLine },
  { href: "/dashboard/all-applicants", label: "All Applicants", icon: RiGroupLine },
  { href: "/dashboard/settings", label: "Settings", icon: RiSettings3Line },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <RiFileTextLine className="text-white text-base" />
        </div>
        <span className="font-semibold text-sm text-gray-900">CV Screener</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="text-lg flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
