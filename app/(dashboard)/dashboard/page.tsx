"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";

function DashboardContent() {
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        needReview: 0,
        autoApproved: 0,
        autoRejected: 0,
        failed: 0,
    });

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/dashboard");
            const data = await res.json();
            if (!data.error) setStats(data);
        } catch (err) {
            console.error("Failed to fetch dashboard stats:", err);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <main className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    title="Total Applicants"
                    value={stats.total}
                    description="Semua pelamar masuk"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Apply Today"
                    value={stats.today}
                    description="Submission hari ini"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Need Review"
                    value={stats.needReview}
                    description="Perlu ditinjau manual"
                    href="/dashboard/all-applicants?status=manual_review"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Auto Approved"
                    value={stats.autoApproved}
                    description="Disetujui oleh AI"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Auto Rejected"
                    value={stats.autoRejected}
                    description="Ditolak oleh AI"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Failed"
                    value={stats.failed}
                    description="Gagal diproses"
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    }
                />
            </div>
        </main>
    );
}

export default function DashboardPage() {
    return (
        <>
            <DashboardHeader title="Dashboard" />
            <DashboardContent />
        </>
    );
}
