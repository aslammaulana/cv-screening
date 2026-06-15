"use client";

import { useState, useEffect } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";

export default function DashboardPage() {
    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        needReview: 0,
        autoApproved: 0,
        autoRejected: 0,
        failed: 0,
    });

    useEffect(() => {
        fetch("/api/dashboard")
            .then(res => res.json())
            .then(data => {
                if (!data.error) setStats(data);
            })
            .catch(err => console.error("Failed to fetch dashboard stats:", err));
    }, []);

    return (
        <>
            <DashboardHeader title="Dashboard" />
            <main className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <MetricCard title="Total Applicants" value={stats.total} />
                    <MetricCard title="Apply Today" value={stats.today} />
                    <MetricCard title="Need Review" value={stats.needReview} />
                    <MetricCard title="Auto Approved" value={stats.autoApproved} />
                    <MetricCard title="Auto Rejected" value={stats.autoRejected} />
                    <MetricCard title="Failed" value={stats.failed} />
                </div>
            </main>
        </>
    );
}
