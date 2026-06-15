"use client";

import { RiUserSharedLine, RiCheckboxCircleLine, RiTimeLine } from "react-icons/ri";

interface StatsHeaderProps {
    total: number;
    approved: number;
    pending: number;
}

export default function StatsHeader({ total, approved, pending }: StatsHeaderProps) {
    const stats = [
        { label: "Total Applicants", value: total, icon: RiUserSharedLine, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Approved", value: approved, icon: RiCheckboxCircleLine, color: "text-green-600", bg: "bg-green-50" },
        { label: "Pending", value: pending, icon: RiTimeLine, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                        <stat.icon className="text-2xl" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
