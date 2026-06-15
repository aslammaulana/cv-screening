"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface HeaderProps {
    onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    return (
        <header className="lg:hidden flex items-center justify-between p-4 bg-tm-secondary border-b-2 border-tm-border sticky top-0 z-40 text-white shadow-sm">
            <Link href="/dashboard" className="flex items-center gap-3">
                <div className="shrink-0">
                    <Image src="/logo-tmbh-512.png" alt="Logo" width={32} height={32} className="rounded-lg h-8 w-8" />
                </div>
                <span className="text-lg font-semibold tracking-tight">CV Screener</span>
            </Link>

            {/* Menu button — triggers mobile sidebar */}
            <button
                onClick={onMenuClick}
                className="rounded-lg p-2 text-zinc-400 hover:bg-[#27272a] hover:text-white transition-colors"
                aria-label="Toggle menu"
            >
                <Menu size={20} />
            </button>
        </header>
    )
}
