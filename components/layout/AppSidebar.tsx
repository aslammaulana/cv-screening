"use client"

import { useState, useEffect } from "react"
import { LayoutDashboard, Award, Settings, X, ChevronRight, Users } from "lucide-react"
import { FiUpload } from "react-icons/fi"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import clsx from "clsx"

interface AppSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/all-applicants", label: "All Applicants", icon: Users },
  { href: "/dashboard/qualification", label: "Qualifications", icon: Award },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/apply", label: "Test Apply", icon: FiUpload },
]

export default function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname()

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onMobileClose) onMobileClose()
  }, [pathname])

  const navContent = (isMobile: boolean) => (
    <nav className={clsx("flex flex-col gap-2 px-2 py-4", isMobile ? "group-mobile" : "")}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        const className = clsx(
          "flex h-10 w-full items-center justify-start rounded-lg px-3 transition-colors",
          isActive
            ? "bg-[#ffffff23] text-white"
            : "text-zinc-400 hover:bg-[#27272a] hover:text-white"
        )

        return (
          <Link key={item.href} href={item.href} className={className}>
            <div className="relative shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <span className={clsx(
              "ml-3 overflow-hidden text-sm font-medium whitespace-nowrap",
              isMobile
                ? "opacity-100"
                : "opacity-0 transition-all duration-300 group-hover:opacity-100"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* ── DESKTOP SIDEBAR — hover to expand ── */}
      <aside className="group hidden md:flex fixed left-0 top-0 z-40 h-screen w-[64px] flex-col border-r border-tm-border bg-tm-background transition-all duration-300 ease-in-out hover:w-[240px] overflow-y-auto overflow-x-hidden scrollbar-thin">
        {/* Desktop sidebar header */}
        <Link href="/dashboard" className="flex h-[65px] items-center gap-3 px-3 border-b border-tm-border shrink-0">
          <div className="shrink-0">
            <Image src="/logo-tmbh-512.png" alt="Logo" width={38} height={38} className="rounded-lg h-10 w-10" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white opacity-0 transition-all duration-300 group-hover:opacity-100 whitespace-nowrap">CV Screener</span>
        </Link>
        {navContent(false)}
      </aside>

      {/* ── MOBILE SIDEBAR — slide in from left ── */}
      <aside
        className={clsx(
          "fixed top-0 left-0 z-50 h-screen w-[80%] flex-col border-r-2 border-tm-border bg-tm-secondary overflow-y-auto overflow-x-hidden transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
        )}
      >{/* Mobile sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-tm-border">
          <Link href="/dashboard" onClick={onMobileClose} className="flex items-center gap-3">
            <div className="shrink-0">
              <Image src="/logo-tmbh-512.png" alt="Logo" width={32} height={32} className="rounded-lg h-8 w-8" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">CV Screener</span>
          </Link>
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center rounded-lg text-[#ffffffbe] hover:text-[#ffffff] transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>
        {navContent(true)}
      </aside>

      {/* Overlay for mobile sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}
    </>
  )
}
