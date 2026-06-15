"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import ApplicantTable from "@/components/applicants/ApplicantTable";
import FilterBar from "@/components/applicants/FilterBar";

function DashboardContent() {
    const searchParams = useSearchParams();
    const initialStatusParam = searchParams.get("status");
    const initialStatus = initialStatusParam === 'manual_review' ? 'Needs Review' : 'All Status';

    const [stats, setStats] = useState({
        total: 0,
        today: 0,
        needReview: 0,
        autoApproved: 0,
        autoRejected: 0,
        failed: 0,
    });

    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({
        search: "",
        position: "All Positions",
        status: initialStatus
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

    const fetchApplicants = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.status !== "All Status") {
                params.set("status", filter.status);
            }

            const res = await fetch(`/api/applicants?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                console.error("Failed to fetch applicants:", data.error);
            } else {
                setApplicants(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchApplicants();
    }, [filter.status]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const res = await fetch("/api/applicants", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });

        if (res.ok) {
            fetchApplicants();
            fetchStats();
        } else {
            alert("Gagal mengubah status pelamar.");
        }
    };

    const handleRegenerate = async (id: string) => {
        try {
            const res = await fetch("/api/ai/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicant_id: id }),
            });

            if (res.ok) {
                await fetchApplicants();
                await fetchStats();
            } else {
                const data = await res.json();
                alert(`Gagal regenerasi AI: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Regenerate AI error:", err);
            alert("Terjadi kesalahan saat memproses AI.");
        }
    };

    const filteredApplicants = applicants.filter(a => {
        const matchSearch = (a.nama || "").toLowerCase().includes(filter.search.toLowerCase()) ||
            (a.email || "").toLowerCase().includes(filter.search.toLowerCase());
        const matchPosition = filter.position === "All Positions" || a.position === filter.position;
        return matchSearch && matchPosition;
    });

    return (
        <main className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard title="Total Applicants" value={stats.total} />
                <MetricCard title="Apply Today" value={stats.today} />
                <MetricCard title="Need Review" value={stats.needReview} />
                <MetricCard title="Auto Approved" value={stats.autoApproved} />
                <MetricCard title="Auto Rejected" value={stats.autoRejected} />
                <MetricCard title="Failed" value={stats.failed} />
            </div>

            <div className="bg-tm-secondary border border-tm-border rounded-2xl overflow-hidden shadow-xl">
                <FilterBar filter={filter} setFilter={setFilter} />
                <ApplicantTable
                    applicants={filteredApplicants}
                    isLoading={isLoading}
                    onStatusChange={handleStatusChange}
                    onRegenerate={handleRegenerate}
                />
            </div>
        </main>
    );
}

export default function DashboardPage() {
    return (
        <>
            <DashboardHeader title="Dashboard" />
            <Suspense fallback={<div className="p-8">Loading Dashboard...</div>}>
                <DashboardContent />
            </Suspense>
        </>
    );
}
