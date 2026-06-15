"use client";

import { useState, useMemo } from "react";
import { Applicant, ApplicantStatus } from "@/lib/data/applicants";
import StatusBadge from "./StatusBadge";
import AIReasonPopover from "./AIReasonPopover";
import {
    RiExternalLinkLine,
    RiCheckLine,
    RiCloseLine,
    RiRestartLine,
    RiArrowUpSLine,
    RiArrowDownSLine,
    RiExpandUpDownLine,
} from "react-icons/ri";

type SortKey = "nama" | "email" | "gender" | "position" | "score_total" | "status";
type SortDir = "asc" | "desc" | null;

interface SortState {
    key: SortKey | null;
    dir: SortDir;
}

interface ApplicantTableProps {
    applicants: any[];
    isLoading?: boolean;
    onStatusChange: (id: string, newStatus: string) => void;
    onRegenerate: (id: string) => Promise<void>;
    selectedIds: string[];
    onSelectAll: (checked: boolean) => void;
    onSelectOne: (id: string, checked: boolean) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active || dir === null) {
        return <RiExpandUpDownLine className="text-[11px] text-zinc-600 group-hover:text-zinc-400 transition-colors" />;
    }
    if (dir === "asc") {
        return <RiArrowUpSLine className="text-[13px] text-zinc-200" />;
    }
    return <RiArrowDownSLine className="text-[13px] text-zinc-200" />;
}

export default function ApplicantTable({
    applicants,
    isLoading,
    onStatusChange,
    onRegenerate,
    selectedIds,
    onSelectAll,
    onSelectOne,
}: ApplicantTableProps) {
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);
    const [sort, setSort] = useState<SortState>({ key: null, dir: null });

    const handleSort = (key: SortKey) => {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            if (prev.dir === "desc") return { key: null, dir: null };
            return { key, dir: "asc" };
        });
    };

    // Stamp original fetch order so we can always restore it after sort reset
    const indexedApplicants = useMemo(
        () => applicants.map((a, i) => ({ ...a, __idx: i })),
        [applicants]
    );

    const sortedApplicants = useMemo(() => {
        if (!sort.key || !sort.dir) {
            // Restore original fetch order
            return [...indexedApplicants].sort((a, b) => a.__idx - b.__idx);
        }
        return [...indexedApplicants].sort((a, b) => {
            // numeric sort for score
            if (sort.key === "score_total") {
                const aNum = parseFloat(a.score_total) || 0;
                const bNum = parseFloat(b.score_total) || 0;
                return sort.dir === "asc" ? aNum - bNum : bNum - aNum;
            }
            const aVal = (a[sort.key!] ?? "").toString().toLowerCase();
            const bVal = (b[sort.key!] ?? "").toString().toLowerCase();
            if (aVal < bVal) return sort.dir === "asc" ? -1 : 1;
            if (aVal > bVal) return sort.dir === "asc" ? 1 : -1;
            // stable tie-breaker: keep original order
            return a.__idx - b.__idx;
        });
    }, [indexedApplicants, sort]);

    if (isLoading) {
        return (
            <div className="px-6 py-32 text-center text-sm text-zinc-600">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
                    <span>Loading applicants...</span>
                </div>
            </div>
        );
    }

    if (applicants.length === 0) {
        return (
            <div className="px-6 py-32 text-center text-sm text-zinc-600">
                No applicants match the current filters.
            </div>
        );
    }

    const openApplicant = applicants.find((a) => a.id === openPopoverId);
    const isAllSelected = applicants.length > 0 && selectedIds.length === applicants.length;

    const handleRegenerate = async (id: string) => {
        setIsRegenerating(id);
        try {
            await onRegenerate(id);
        } finally {
            setIsRegenerating(null);
        }
    };

    // Helper: build a sortable header cell
    const SortableTh = ({
        label,
        sortKey,
        className = "",
    }: {
        label: string;
        sortKey: SortKey;
        className?: string;
    }) => (
        <th
            className={`text-left px-4 py-3.5 border-b border-r border-zinc-800/70 ${className}`}
        >
            <button
                onClick={() => handleSort(sortKey)}
                className="group flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer"
            >
                {label}
                <SortIcon active={sort.key === sortKey} dir={sort.key === sortKey ? sort.dir : null} />
            </button>
        </th>
    );

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-0">
                    <thead>
                        <tr className="bg-zinc-950/60 text-[12px] text-zinc-500 font-bold uppercase tracking-widest">
                            {/* Select-all dot */}
                            <th className="px-4 py-3.5 w-10 border-b border-r border-zinc-800/70">
                                <button
                                    onClick={() => onSelectAll(!isAllSelected)}
                                    className="w-4 h-4 rounded-full border-2 border-zinc-600 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors mx-auto"
                                    title="Select all"
                                >
                                    {isAllSelected && (
                                        <span className="w-2 h-2 rounded-full bg-zinc-200 block" />
                                    )}
                                </button>
                            </th>
                            {/* NO */}
                            <th className="text-left px-4 py-3.5 w-12 border-b border-r border-zinc-800/70">
                                NO
                            </th>
                            {/* Sortable headers */}
                            <SortableTh label="NAME" sortKey="nama" />
                            <th className="text-left px-4 py-3.5 border-b border-r border-zinc-800/70">
                                EMAIL
                            </th>
                            <SortableTh label="GENDER" sortKey="gender" className="w-24" />
                            <SortableTh label="POSITION" sortKey="position" className="whitespace-nowrap" />
                            <SortableTh label="SCORE" sortKey="score_total" className="w-20" />
                            {/* CV — not sortable */}
                            <th className="text-left px-4 py-3.5 w-14 border-b border-r border-zinc-800/70">
                                CV
                            </th>
                            <SortableTh label="STATUS" sortKey="status" className="w-48" />
                            {/* AI REASON — not sortable */}
                            <th className="text-left px-4 py-3.5 w-32 border-b border-r border-zinc-800/70">
                                AI REASON
                            </th>
                            {/* ACTION */}
                            <th className="text-left px-4 py-3.5 w-28 border-b border-zinc-800/70">
                                ACTION
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedApplicants.map((a, idx) => (
                            <tr
                                key={a.id}
                                className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors duration-100 group"
                            >
                                {/* Row dot selector */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 text-center">
                                    <button
                                        onClick={() => onSelectOne(a.id, !selectedIds.includes(a.id))}
                                        className="w-4 h-4 rounded-full border-2 border-zinc-700 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors mx-auto"
                                        title="Select row"
                                    >
                                        {selectedIds.includes(a.id) && (
                                            <span className="w-2 h-2 rounded-full bg-zinc-200 block" />
                                        )}
                                    </button>
                                </td>
                                {/* NO */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 text-zinc-500 font-bold text-[10px]">
                                    {idx + 1}
                                </td>
                                {/* NAME */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 font-medium text-zinc-200 whitespace-nowrap text-xs">
                                    {a.nama}
                                </td>
                                {/* EMAIL */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 text-zinc-500 text-xs">
                                    {a.email}
                                </td>
                                {/* GENDER */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 text-zinc-400 text-xs">
                                    {a.gender?.charAt(0).toUpperCase() || "—"}
                                </td>
                                {/* POSITION */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 text-zinc-400 text-xs whitespace-nowrap">
                                    {a.position}
                                </td>
                                {/* SCORE */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40 font-bold text-zinc-200 text-sm">
                                    {a.score_total > 0 ? a.score_total : "—"}
                                </td>
                                {/* CV */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40">
                                    <a
                                        href={
                                            a.cv_url.startsWith("http")
                                                ? a.cv_url
                                                : `https://tmaqkrpgkkptzgddpdnk.supabase.co/storage/v1/object/public/cv-uploads/${a.cv_url}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1.5 rounded-md bg-blue-500/5 text-blue-500/60 border border-blue-500/10 hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/25 transition-all"
                                        title="Open CV"
                                    >
                                        <RiExternalLinkLine className="text-base" />
                                    </a>
                                </td>
                                {/* STATUS */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={a.status as ApplicantStatus} />
                                        <button
                                            onClick={() => handleRegenerate(a.id)}
                                            disabled={isRegenerating === a.id}
                                            title="Regenerate AI Review"
                                            className={`p-1.5 rounded-md border border-zinc-800 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer ${isRegenerating === a.id
                                                ? "animate-spin text-blue-400 border-blue-400/30"
                                                : ""
                                                }`}
                                        >
                                            <RiRestartLine className="text-[11px]" />
                                        </button>
                                    </div>
                                </td>
                                {/* AI REASON */}
                                <td className="px-4 py-3.5 border-r border-zinc-800/40">
                                    <button
                                        onClick={() => setOpenPopoverId(a.id)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/30 border border-zinc-700/50 px-3 py-1.5 rounded-md hover:bg-zinc-100 hover:text-zinc-900 hover:border-white transition-all cursor-pointer"
                                    >
                                        View
                                    </button>
                                </td>
                                {/* ACTION */}
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onStatusChange(a.id, "approved")}
                                            disabled={a.status === "approved"}
                                            title="Approve"
                                            className="flex items-center justify-center w-7 h-7 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <RiCheckLine className="text-sm" />
                                        </button>
                                        <button
                                            onClick={() => onStatusChange(a.id, "rejected")}
                                            disabled={a.status === "rejected"}
                                            title="Reject"
                                            className="flex items-center justify-center w-7 h-7 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <RiCloseLine className="text-sm" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openApplicant && (
                <AIReasonPopover
                    applicant={openApplicant}
                    onClose={() => setOpenPopoverId(null)}
                />
            )}
        </>
    );
}
