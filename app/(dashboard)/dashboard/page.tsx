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
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
                const applicantsData = Array.isArray(data) ? data : [];
                setApplicants(applicantsData);
                // Clean up selected IDs if they are no longer in the list
                setSelectedIds(prev => prev.filter(id => applicantsData.some(a => a.id === id)));
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

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} applicants?`)) return;

        try {
            // Assuming there's a bulk delete API or we call delete for each
            // For now, let's assume we need to implement it or use a loop if API doesn't support bulk
            // Let's check if there's a delete API. Usually it's DELETE /api/applicants
            const promises = selectedIds.map(id =>
                fetch(`/api/applicants?id=${id}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            setSelectedIds([]);
            fetchApplicants();
            fetchStats();
        } catch (err) {
            console.error("Delete error:", err);
            alert("Failed to delete some applicants.");
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(filteredApplicants.map(a => a.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(i => i !== id));
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
                    href="/dashboard?status=manual_review"
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

            {/* ── Main content wrapper ── */}
            <div className="relative rounded-2xl bg-tm-secondary border border-tm-border overflow-hidden shadow-xl">
                <FilterBar
                    filter={filter}
                    setFilter={setFilter}
                    selectedCount={selectedIds.length}
                    onDeleteSelected={handleDeleteSelected}
                />
                <ApplicantTable
                    applicants={filteredApplicants}
                    isLoading={isLoading}
                    onStatusChange={handleStatusChange}
                    onRegenerate={handleRegenerate}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
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
