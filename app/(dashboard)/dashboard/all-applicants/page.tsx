"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/layout/DashboardHeader";
import ApplicantTable from "@/components/applicants/ApplicantTable";
import StatsHeader from "@/components/applicants/StatsHeader";
import FilterBar from "@/components/applicants/FilterBar";

function AllApplicantsContent() {
    const searchParams = useSearchParams();
    const initialStatusParam = searchParams.get("status");

    const initialStatus = initialStatusParam === 'manual_review' ? 'Needs Review' : 'All Status';

    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState({
        search: "",
        position: "All Positions",
        status: initialStatus
    });

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
            <StatsHeader
                total={applicants.length}
                approved={applicants.filter(a => ['approved', 'auto_approved'].includes(a.status)).length}
                pending={applicants.filter(a => a.status === 'pending').length}
            />

            <div className="mt-8 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
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

export default function AllApplicantsPage() {
    return (
        <>
            <DashboardHeader title="All Applicants" />
            <Suspense fallback={<div className="p-8">Loading...</div>}>
                <AllApplicantsContent />
            </Suspense>
        </>
    );
}
