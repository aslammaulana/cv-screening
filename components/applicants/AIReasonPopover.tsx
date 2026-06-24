"use client";

import { useEffect, useRef } from "react";
import { Applicant } from "@/lib/data/applicants";
import { RiCloseLine, RiSparklingLine } from "react-icons/ri";

interface AIReasonPopoverProps {
    applicant: Applicant;
    onClose: () => void;
}

export default function AIReasonPopover({ applicant, onClose }: AIReasonPopoverProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    const formatReason = (reason: string) => {
        if (!reason) return null;

        // Cek apakah string ini adalah JSON array
        if (reason.trim().startsWith("[")) {
            try {
                const reasons = JSON.parse(reason);
                if (Array.isArray(reasons)) {
                    return (
                        <ul className="list-disc pl-5 space-y-1">
                            {reasons.map((item, i) => (
                                <li key={i} className="text-[14px] text-white/60 leading-relaxed">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    );
                }
            } catch (e) {
                // Jika gagal parse, biarkan sebagai text biasa
            }
        }

        // Default text biasa
        return (
            <p className="text-[13px] text-zinc-200 leading-relaxed ">
                {reason}
            </p>
        );

    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={ref}
                className="relative bg-tm-secondary border border-tm-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                    <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">

                            AI Reasoning
                        </h3>
                        <p className="text-[13px] text-zinc-400 mt-1">{applicant.nama} · {applicant.position}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <RiCloseLine className="text-xl" />
                    </button>
                </div>

                <div className="px-6 shrink-0">
                    <hr className="border-tm-border" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto  p-6 pt-5 custom-scrollbar">
                    {applicant.ai_reason_accept ? (
                        formatReason(applicant.ai_reason_accept)
                    ) : (
                        <p className="text-[14px] text-zinc-500 italic">Belum ada analisa AI.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
