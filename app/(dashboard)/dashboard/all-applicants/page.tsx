"use client";

import { useState, useEffect, Suspense } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import ApplicantTable, { SortKey, SortState } from "@/components/applicants/ApplicantTable";
import FilterBar from "@/components/applicants/FilterBar";
import ErrorModal from "@/components/ui/ErrorModal";

function AllApplicantsContent() {
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filter, setFilter] = useState({
        search: "",
        position: "All Positions",
        status: "All Status"
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [sort, setSort] = useState<SortState>({ key: null, dir: null });
    const [error, setError] = useState<{ isOpen: boolean; title: string; message: string }>({
        isOpen: false,
        title: "",
        message: ""
    });

    const sanitizeErrorMessage = (msg: string) => {
        if (!msg) return "An unexpected error occurred.";
        if (msg.includes("429") || msg.includes("quota")) return "429 Too Many Request (Batas kuota terlampaui)";
        if (msg.includes("503") || msg.includes("Service Unavailable")) return "503 Service Unavailable (Model sedang sibuk)";
        if (msg.includes("500")) return "500 Internal Server Error (Kesalahan server AI)";
        return msg.length > 100 ? `${msg.substring(0, 100)}...` : msg;
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
                setSelectedIds(prev => prev.filter(id => applicantsData.some(a => a.id === id)));
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
        setIsLoading(false);
    };

    const handleSort = (key: SortKey) => {
        setSort((prev) => {
            if (prev.key !== key) {
                // Default to 'desc' for score, 'asc' for others
                const initialDir = key === "score_total" ? "desc" : "asc";
                return { key, dir: initialDir };
            }
            return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
        });
    };

    const handleResetSort = () => setSort({ key: null, dir: null });

    useEffect(() => {
        fetchApplicants();
    }, [filter.status]);

    // Reset page on filter change
    useEffect(() => {
        setPage(1);
    }, [filter.search, filter.position, filter.status, pageSize]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        const res = await fetch("/api/applicants", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });

        if (res.ok) {
            fetchApplicants();
        } else {
            const data = await res.json();
            setError({
                isOpen: true,
                title: "Update Gagal",
                message: sanitizeErrorMessage(data.error)
            });
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
                setError({
                    isOpen: true,
                    title: "AI Process Failed",
                    message: sanitizeErrorMessage(data.error)
                });
            }
        } catch (err: any) {
            console.error("Regenerate AI error:", err);
            setError({
                isOpen: true,
                title: "System Error",
                message: sanitizeErrorMessage(err.message)
            });
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} applicants?`)) return;

        try {
            const promises = selectedIds.map(id =>
                fetch(`/api/applicants?id=${id}`, { method: "DELETE" })
            );

            await Promise.all(promises);
            setSelectedIds([]);
            fetchApplicants();
        } catch (err: any) {
            console.error("Delete error:", err);
            setError({
                isOpen: true,
                title: "Delete Failed",
                message: sanitizeErrorMessage(err.message)
            });
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

    const totalRecords = filteredApplicants.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;
    const paginatedApplicants = filteredApplicants.slice((page - 1) * pageSize, page * pageSize);

    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | undefined>(undefined);

    const handleBatchProcess = async () => {
        const pendingStatuses = ["pending", "scoring", "extracted", "failed"];
        const toProcess = applicants.filter(a => pendingStatuses.includes(a.status));

        if (toProcess.length === 0) {
            alert("No pending or failed applicants found to process.");
            return;
        }

        if (!confirm(`Found ${toProcess.length} applicants to process. Start batch processing with 5-second delay between each?`)) {
            return;
        }

        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: toProcess.length });

        for (let i = 0; i < toProcess.length; i++) {
            const applicant = toProcess[i];
            setBatchProgress({ current: i + 1, total: toProcess.length });

            try {
                // Reuse handleRegenerate logic but without the fetchApplicants at each step for smoother batch
                const res = await fetch("/api/ai/process", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ applicant_id: applicant.id }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    console.error(`Batch failed for ${applicant.nama}:`, data.error);
                }
            } catch (err) {
                console.error(`System error in batch for ${applicant.nama}:`, err);
            }

            // Wait 5 seconds if not the last one
            if (i < toProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        setIsBatchProcessing(false);
        setBatchProgress(undefined);
        fetchApplicants(); // Final refresh
    };

    return (
        <div>
            {/* FilterBar — static, does not scroll */}
            <FilterBar
                filter={filter}
                setFilter={setFilter}
                selectedCount={selectedIds.length}
                onDeleteSelected={handleDeleteSelected}
                onRefresh={fetchApplicants}
                onResetSort={handleResetSort}
                isSorted={!!sort.key}
                isLoading={isLoading}
                onBatchProcess={handleBatchProcess}
                isBatchProcessing={isBatchProcessing}
                batchProgress={batchProgress}
            />

            {/* ── Scrollable table area only ── */}
            {/* calc: 100dvh minus DashboardHeader(~57px) minus FilterBar(~48px) minus footer(~44px) */}
            <div
                className="overflow-x-auto overflow-y-scroll"
                style={{ height: 'calc(100dvh - 57px - 48px - 44px)' }}
            >
                <div className="pb-20 bg-[#171717]">
                    <ApplicantTable
                        applicants={paginatedApplicants}
                        isLoading={isLoading}
                        onStatusChange={handleStatusChange}
                        onRegenerate={handleRegenerate}
                        selectedIds={selectedIds}
                        onSelectAll={() => handleSelectAll(selectedIds.length !== filteredApplicants.length)}
                        onSelectOne={handleSelectOne}
                        sort={sort}
                        onSort={handleSort}
                    />
                </div>
            </div>

            {/* ── Fixed Pagination Footer ── */}
            <div className="fixed bottom-0 left-0 md:left-[64px] right-0 bg-[#161616] border-t border-tm-border px-6 py-3 flex items-center justify-between text-xs text-zinc-400 z-30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-md border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className="text-zinc-500">Page</span>
                        <div className="w-10 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-200">
                            {page}
                        </div>
                        <span className="text-zinc-500">of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-1.5 rounded-md border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 px-3 py-1.5 pr-8 rounded-md hover:border-zinc-700 transition-all cursor-pointer outline-none font-bold"
                            >
                                <option value={50}>50 rows</option>
                                <option value={100}>100 rows</option>
                                <option value={200}>200 rows</option>
                                <option value={500}>500 rows</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-zinc-500 font-medium ml-2">{totalRecords} records</span>
                    </div>
                </div>

                <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
                    Showing {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalRecords)}
                </div>
            </div>

            <ErrorModal
                isOpen={error.isOpen}
                onClose={() => setError({ ...error, isOpen: false })}
                title={error.title}
                message={error.message}
            />
        </div>
    );
}

export default function AllApplicantsPage() {
    return (
        <>
            <DashboardHeader title="All Applicants" />
            <Suspense fallback={
                <div className="flex items-center justify-center py-20 text-zinc-500 gap-3">
                    <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                </div>
            }>
                <AllApplicantsContent />
            </Suspense>
        </>
    );
}
