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
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center text-sm text-gray-400">
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
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center text-sm text-gray-400">
                No applicants match the current filters.
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 font-medium">
                                <th className="text-left px-4 py-3">Name</th>
                                <th className="text-left px-4 py-3">Email</th>
                                <th className="text-center px-3 py-3 w-16">Gender</th>
                                <th className="text-left px-4 py-3">Position</th>
                                <th className="text-center px-3 py-3 w-16">Score</th>
                                <th className="text-center px-3 py-3 w-12">CV</th>
                                <th className="text-left px-4 py-3 w-36">Status</th>
                                <th className="text-center px-3 py-3 w-24">AI Reason</th>
                                <th className="text-center px-3 py-3 w-28">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {applicants.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    {/* Name */}
                                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                                        {a.nama}
                                    </td>
                                    {/* Email */}
                                    <td className="px-4 py-3 text-gray-500 text-xs">{a.email}</td>
                                    {/* Gender */}
                                    <td className="px-3 py-3 text-center text-gray-600">
                                        {a.gender === "Male" ? "M" : "F"}
                                    </td>
                                    {/* Position */}
                                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{a.position}</td>
                                    {/* Score */}
                                    <td className="px-3 py-3 text-center font-semibold text-gray-800">
                                        {a.score_total > 0 ? a.score_total : "—"}
                                    </td>
                                    {/* CV */}
                                    <td className="px-3 py-3 text-center">
                                        <a
                                            href={a.cv_url.startsWith('http')
                                                ? a.cv_url
                                                : `https://tmaqkrpgkkptzgddpdnk.supabase.co/storage/v1/object/public/cv-uploads/${a.cv_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700 transition-colors"
                                            title="Open CV"
                                        >
                                            <RiExternalLinkLine className="text-base" />
                                        </a>
                                    </td>
                                    {/* Status */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={a.status as ApplicantStatus} />
                                            <button
                                                onClick={() => handleRegenerate(a.id)}
                                                disabled={isRegenerating === a.id}
                                                title="Regenerate AI Review"
                                                className={`p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all ${isRegenerating === a.id ? 'animate-spin text-blue-600 border-blue-200' : ''}`}
                                            >
                                                <RiRestartLine className="text-sm" />
                                            </button>
                                        </div>
                                    </td>
                                    {/* AI Reason */}
                                    <td className="px-3 py-3 text-center">
                                        <button
                                            onClick={() => setOpenPopoverId(a.id)}
                                            className="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                        >
                                            View
                                        </button>
                                    </td>
                                    {/* Action */}
                                    <td className="px-3 py-3 text-center">
                                        {['manual_review', 'pending'].includes(a.status) ? (
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onStatusChange(a.id, 'approved')}
                                                    title="Approve"
                                                    className="flex items-center justify-center w-7 h-7 rounded-md bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 transition-colors"
                                                >
                                                    <RiCheckLine className="text-sm" />
                                                </button>
                                                <button
                                                    onClick={() => onStatusChange(a.id, 'rejected')}
                                                    title="Reject"
                                                    className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                                                >
                                                    <RiCloseLine className="text-sm" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
