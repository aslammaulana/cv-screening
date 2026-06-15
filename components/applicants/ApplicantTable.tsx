"use client";

import { useState } from "react";
import { Applicant, ApplicantStatus } from "@/lib/data/applicants";
import StatusBadge from "./StatusBadge";
import AIReasonPopover from "./AIReasonPopover";
import { RiExternalLinkLine, RiCheckLine, RiCloseLine, RiRestartLine } from "react-icons/ri";

interface ApplicantTableProps {
    applicants: any[];
    isLoading?: boolean;
    onStatusChange: (id: string, newStatus: string) => void;
    onRegenerate: (id: string) => Promise<void>;
}

export default function ApplicantTable({
    applicants,
    isLoading,
    onStatusChange,
    onRegenerate,
}: ApplicantTableProps) {
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="bg-tm-secondary border border-tm-border rounded-xl px-6 py-16 text-center text-sm text-zinc-500">
                Loading applicants...
            </div>
        );
    }

    const openApplicant = applicants.find((a) => a.id === openPopoverId);

    const handleRegenerate = async (id: string) => {
        setIsRegenerating(id);
        try {
            await onRegenerate(id);
        } finally {
            setIsRegenerating(null);
        }
    };

    if (applicants.length === 0) {
        return (
            <div className="bg-tm-secondary border border-tm-border rounded-xl px-6 py-16 text-center text-sm text-zinc-500">
                No applicants match the current filters.
            </div>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-tm-border bg-tm-background text-xs text-zinc-400 font-medium uppercase tracking-wider">
                            <th className="text-left px-4 py-4">Name</th>
                            <th className="text-left px-4 py-4">Email</th>
                            <th className="text-center px-3 py-4 w-16">Gender</th>
                            <th className="text-left px-4 py-4">Position</th>
                            <th className="text-center px-3 py-4 w-16">Score</th>
                            <th className="text-center px-3 py-4 w-12">CV</th>
                            <th className="text-left px-4 py-4 w-40">Status</th>
                            <th className="text-center px-3 py-4 w-28">AI Reason</th>
                            <th className="text-center px-3 py-4 w-28">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-tm-border">
                        {applicants.map((a) => (
                            <tr key={a.id} className="hover:bg-tm-background transition-all duration-200">
                                <td className="px-4 py-4 font-medium text-zinc-100 whitespace-nowrap">
                                    {a.nama}
                                </td>
                                <td className="px-4 py-4 text-zinc-400 text-xs">{a.email}</td>
                                <td className="px-3 py-4 text-center text-zinc-300">
                                    {a.gender === "Male" ? "M" : "F"}
                                </td>
                                <td className="px-4 py-4 text-zinc-200 whitespace-nowrap">{a.position}</td>
                                <td className="px-3 py-4 text-center font-bold text-white">
                                    {a.score_total > 0 ? a.score_total : "—"}
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <a
                                        href={a.cv_url.startsWith('http')
                                            ? a.cv_url
                                            : `https://tmaqkrpgkkptzgddpdnk.supabase.co/storage/v1/object/public/cv-uploads/${a.cv_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Open CV"
                                    >
                                        <RiExternalLinkLine className="text-lg" />
                                    </a>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge status={a.status as ApplicantStatus} />
                                        <button
                                            onClick={() => handleRegenerate(a.id)}
                                            disabled={isRegenerating === a.id}
                                            title="Regenerate AI Review"
                                            className={`p-1.5 rounded-md border border-tm-border text-zinc-500 hover:bg-tm-border hover:text-blue-400 transition-all ${isRegenerating === a.id ? 'animate-spin text-blue-400 border-blue-400/30' : ''}`}
                                        >
                                            <RiRestartLine className="text-sm" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    <button
                                        onClick={() => setOpenPopoverId(a.id)}
                                        className="text-xs text-blue-400 border border-blue-400/30 px-3 py-1.5 rounded-md hover:bg-blue-400/10 hover:border-blue-400 transition-all"
                                    >
                                        View
                                    </button>
                                </td>
                                <td className="px-3 py-4 text-center">
                                    {['manual_review', 'pending'].includes(a.status) ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onStatusChange(a.id, 'approved')}
                                                title="Approve"
                                                className="flex items-center justify-center w-8 h-8 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all"
                                            >
                                                <RiCheckLine className="text-lg" />
                                            </button>
                                            <button
                                                onClick={() => onStatusChange(a.id, 'rejected')}
                                                title="Reject"
                                                className="flex items-center justify-center w-8 h-8 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all"
                                            >
                                                <RiCloseLine className="text-lg" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-zinc-700">—</span>
                                    )}
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
