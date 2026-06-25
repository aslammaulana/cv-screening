"use client";

import { useState, useMemo } from "react";
import { Applicant, ApplicantStatus } from "@/lib/data/applicants";
import StatusBadge from "./StatusBadge";
import AIReasonPopover from "./AIReasonPopover";
import {
    RiExternalLinkLine,
    RiCheckLine,
    RiCloseLine,
    RiSearchLine,
    RiFilter3Line,
    RiArrowUpSLine,
    RiArrowDownSLine,
    RiLoader4Line,
    RiRestartLine,
    RiSubtractLine,
} from "react-icons/ri";
import { FaStop } from "react-icons/fa";

export type SortKey = "nama" | "email" | "gender" | "position" | "score_total" | "status";
export type SortDir = "asc" | "desc" | null;

export interface SortState {
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
    // Controlled sorting
    sort: SortState;
    onSort: (key: SortKey) => void;
    processingId?: string | null;
    onStop?: () => void;
}


function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
    // Show down arrow by default when newest (null state) to indicate "Click to sort"
    // or when actively sorting descending.
    if (!active || dir === null) {
        return <RiArrowDownSLine className="text-[13px] text-white/20" />;
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
    sort,
    onSort,
    processingId,
    onStop
}: ApplicantTableProps) {

    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);


    // Stamp original fetch order
    const indexedApplicants = useMemo(
        () => applicants.map((a, i) => ({ ...a, __idx: i })),
        [applicants]
    );

    const sortedApplicants = useMemo(() => {
        if (!sort.key || !sort.dir) {
            // Default: Newest first. 
            // The API already returns applicants ordered by created_at DESC.
            // So we just maintain that order by sorting ascending on our original index.
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
            return b.__idx - a.__idx; // stable tie-breaker: newest first
        });
    }, [indexedApplicants, sort]);

    const openApplicant = indexedApplicants.find((a) => a.id === openPopoverId);
    const isAllSelected = applicants.length > 0 && selectedIds.length === applicants.length;
    const isIndeterminate = selectedIds.length > 0 && selectedIds.length < applicants.length;

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
            className={`text-left px-4 py-3.5 border-b border-r border-zinc-500/40 ${className}`}
        >
            <button
                onClick={() => onSort(sortKey)}
                className="group flex items-center justify-between w-full hover:text-zinc-200 transition-colors cursor-pointer"
            >
                {label}
                <SortIcon active={sort.key === sortKey} dir={sort.key === sortKey ? sort.dir : null} />
            </button>
        </th>
    );

    return (
        <>
            <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-[#1F1E1F]">
                    <tr className=" text-[12px] text-[#bbbbbb] font-bold  ">
                        {/* Select-all dot */}
                        <th className="px-4 py-3.5 w-10 border-b border-r border-zinc-500/40">
                            <button
                                onClick={() => onSelectAll(!isAllSelected)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all mx-auto ${isAllSelected || isIndeterminate
                                    ? "bg-white border-white text-zinc-950"
                                    : "bg-transparent border-white/40 hover:border-white"
                                    }`}
                                title="Select all"
                            >
                                {isAllSelected && <RiCheckLine className="text-[14px] stroke-1" />}
                                {isIndeterminate && <RiSubtractLine className="text-[14px] stroke-1" />}
                            </button>
                        </th>
                        {/* NO */}
                        <th className="text-left px-4 py-3.5 w-12 border-b border-r border-zinc-500/40">
                            NO
                        </th>
                        {/* Sortable headers */}
                        <SortableTh label="NAME" sortKey="nama" />
                        <th className="text-left px-4 py-3.5 border-b border-r border-zinc-500/40">
                            EMAIL
                        </th>
                        <SortableTh label="GENDER" sortKey="gender" className="w-27" />
                        <SortableTh label="POSITION" sortKey="position" className="whitespace-nowrap" />
                        <SortableTh label="SCORE" sortKey="score_total" className="w-20" />
                        {/* CV — not sortable */}
                        <th className="text-left px-4 py-3.5 w-14 border-b border-r border-zinc-500/40">
                            CV
                        </th>
                        <SortableTh label="STATUS" sortKey="status" className="w-48" />
                        {/* AI REASON — not sortable */}
                        <th className="text-left px-4 py-3.5 w-32 border-b border-r border-zinc-500/40">
                            AI REASON
                        </th>
                        {/* ACTION */}
                        <th className="text-left px-4 py-3.5 w-28 border-b border-zinc-500/40">
                            ACTION
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={11} className="px-6 py-50 bg-[#161616] text-center text-sm text-zinc-600">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-7 h-7 bg-tm-background border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                                    <span>Loading applicants...</span>
                                </div>
                            </td>
                        </tr>
                    ) : applicants.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="px-6 py-32 text-center text-sm text-zinc-600 bg-tm-background">
                                No applicants match the current filters.
                            </td>
                        </tr>
                    ) : (
                        sortedApplicants.map((a, idx) => (
                            <tr
                                key={a.id}
                                className={`hover:bg-[#212121]/40 transition-colors duration-100 group ${idx % 2 === 0
                                    ? "bg-[#161616]"
                                    : "bg-[#161616]"
                                    }`}
                            >
                                {/* Row dot selector */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 text-center">
                                    <button
                                        onClick={() => onSelectOne(a.id, !selectedIds.includes(a.id))}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all mx-auto ${selectedIds.includes(a.id)
                                            ? "bg-white border-white text-zinc-950"
                                            : "bg-transparent border-white/40 hover:border-white"
                                            }`}
                                        title="Select row"
                                    >
                                        {selectedIds.includes(a.id) && (
                                            <RiCheckLine className="text-[14px] stroke-1" />
                                        )}
                                    </button>
                                </td>
                                {/* NO */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 text-zinc-500 font-bold text-[10px]">
                                    {idx + 1}
                                </td>
                                {/* NAME */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 font-medium text-zinc-200 whitespace-nowrap text-xs">
                                    {a.nama}
                                </td>
                                {/* EMAIL */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 text-zinc-500 text-xs">
                                    {a.email}
                                </td>
                                {/* GENDER */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 text-zinc-400 text-xs">
                                    {a.gender?.charAt(0).toUpperCase() || "—"}
                                </td>
                                {/* POSITION */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 text-zinc-400 text-xs whitespace-nowrap">
                                    {a.position}
                                </td>
                                {/* SCORE */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700 font-bold text-zinc-200 text-xs">
                                    {a.score_total > 0 ? a.score_total : "—"}
                                </td>
                                {/* CV */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700">
                                    <a
                                        href={
                                            a.cv_url.startsWith("http")
                                                ? a.cv_url
                                                : `https://tmaqkrpgkkptzgddpdnk.supabase.co/storage/v1/object/public/cv-uploads/${a.cv_url}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1 rounded-md bg-[#2a3d69ee] text-white border border-blue-500/10 hover:bg-blue-500/15 hover:text-white hover:border-blue-500/25 transition-all"
                                        title="Open CV"
                                    >
                                        <RiExternalLinkLine className="text-base" />
                                    </a>
                                </td>
                                {/* STATUS */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700">
                                    <div className="flex items-center justify-between gap-2">
                                        <StatusBadge
                                            status={a.status as ApplicantStatus}
                                            isProcessing={isRegenerating === a.id || processingId === a.id}
                                        />
                                        <button
                                            onClick={(isRegenerating === a.id || processingId === a.id) ? onStop : () => handleRegenerate(a.id)}
                                            title={(isRegenerating === a.id || processingId === a.id) ? "Stop Processing" : "Regenerate AI Review"}
                                            className={`p-1.5 rounded-md border transition-all cursor-pointer ${(isRegenerating === a.id || processingId === a.id)
                                                ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                                                : "border-zinc-600 text-white/70 hover:bg-zinc-700 hover:text-white"
                                                }`}
                                        >
                                            {(isRegenerating === a.id || processingId === a.id) ? (
                                                <FaStop size={10} />
                                            ) : (
                                                <RiRestartLine className="text-[11px]" />
                                            )}
                                        </button>
                                    </div>
                                </td>
                                {/* AI REASON */}
                                <td className="px-4 py-3.5 border-b border-r border-zinc-700">
                                    <button
                                        onClick={() => setOpenPopoverId(a.id)}
                                        className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-800/30 border border-zinc-700/50 px-3 py-1.5 rounded-md hover:bg-zinc-100 hover:text-zinc-900 hover:border-white transition-all cursor-pointer"
                                    >
                                        View
                                    </button>
                                </td>
                                {/* ACTION */}
                                <td className="px-4 py-3.5 border-b border-zinc-700">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onStatusChange(a.id, "approved")}
                                            disabled={a.status === "approved"}
                                            title="Approve"
                                            className="flex items-center justify-center w-7 h-7 rounded-md bg-[#2566426e] text-white border border-[#226942b7] hover:bg-[#2c8554e1] hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <RiCheckLine className="text-sm" />
                                        </button>
                                        <button
                                            onClick={() => onStatusChange(a.id, "rejected")}
                                            disabled={a.status === "rejected"}
                                            title="Reject"
                                            className="flex items-center justify-center w-7 h-7 rounded-md bg-[#541c15b7] text-white border border-[#79281c] hover:bg-[#79281c] hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <RiCloseLine className="text-sm" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {openApplicant && (
                <AIReasonPopover
                    applicant={openApplicant}
                    onClose={() => setOpenPopoverId(null)}
                />
            )}
        </>
    );
}
