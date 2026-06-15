"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";

interface MetricCardProps {
    title: string;
    value: number | string;
    href?: string;
    icon: ReactNode;
    description?: string;
}

export default function MetricCard({ title, value, href, icon, description }: MetricCardProps) {
    const [hovered, setHovered] = useState(false);

    const cardContent = (
        <div
            className="relative w-full rounded-2xl overflow-hidden cursor-default border transition-all duration-300 shadow-lg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: hovered
                    ? "radial-gradient(circle at center 10%, #353535 0%, #161617 100%)"
                    : "#161617",
                borderColor: hovered ? "#4a4a4e" : "#333333",
            }}
        >
            {/* White soft glow on hover */}
            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                    background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 65%)",
                    opacity: hovered ? 1 : 0,
                }}
            />

           
            <div
                className="absolute top-0 left-0 right-0 pointer-events-none z-[5]"
                style={{ height: "40px", background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)" }}
            />

            {/* Content */}
            <div className="relative z-10 p-5">
                {/* Icon */}
                <div
                    className="flex items-center justify-center w-9 h-9 rounded-xl mb-4 border transition-colors duration-300"
                    style={{
                        background: hovered ? "#404040" : "#27272a",
                        borderColor: hovered ? "#52525b" : "#3f3f46",
                    }}
                >
                    <span
                        className="w-4 h-4 flex items-center justify-center transition-colors duration-300"
                        style={{ color: hovered ? "#ffffff" : "#a1a1aa" }}
                    >
                        {icon}
                    </span>
                </div>

                {/* Value */}
                <p className="text-3xl font-bold tracking-tight text-white mb-1">{value}</p>
                <p className="text-sm font-medium text-zinc-400">{title}</p>
                {description && (
                    <p className="text-xs text-zinc-600 mt-1">{description}</p>
                )}
            </div>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block transition-transform duration-300 hover:translate-y-[-2px]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
                {cardContent}
            </Link>
        );
    }

    return <div className="transition-transform duration-300 hover:translate-y-[-2px]">{cardContent}</div>;
}
