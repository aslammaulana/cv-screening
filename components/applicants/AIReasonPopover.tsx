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

        // Try to parse POSITIVES / NEGATIVES sections
        const posMatch = reason.match(/POSITIVES?:\s*([\s\S]*?)(?=NEGATIVES?:|$)/i);
        const negMatch = reason.match(/NEGATIVES?:\s*([\s\S]*?)$/i);

        if (posMatch || negMatch) {
            const parsePoints = (text: string) =>
                text.split('\n')
                    .map(l => l.replace(/^[-•*]\s*/, '').trim())
                    .filter(l => l.length > 0);

            const positives = posMatch ? parsePoints(posMatch[1]) : [];
            const negatives = negMatch ? parsePoints(negMatch[1]) : [];

            return (
                <div className="space-y-5">
                    {positives.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-2">✓ Positives</p>
                            <ul className="space-y-1.5">
                                {positives.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-200 leading-relaxed">
                                        <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {negatives.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">✗ Negatives</p>
                            <ul className="space-y-1.5">
                                {negatives.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-200 leading-relaxed">
                                        <span className="text-red-500 mt-0.5 shrink-0">−</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        // Cek apakah JSON array
        if (reason.trim().startsWith("[")) {
            try {
                const reasons = JSON.parse(reason);
                if (Array.isArray(reasons)) {
                    return (
                        <ul className="list-disc pl-5 space-y-1">
                            {reasons.map((item, i) => (
                                <li key={i} className="text-[13px] text-white/60 leading-relaxed">{item}</li>
                            ))}
                        </ul>
                    );
                }
            } catch (e) { /* fall through */ }
        }

        // Default: multi-paragraph with newlines
        return (
            <div className="space-y-4">
                {reason.split('\n').filter(p => p.trim() !== '').map((para, i) => (
                    <p key={i} className="text-[13px] text-zinc-200 leading-relaxed">
                        {para.trim()}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={ref}
                className="relative bg-tm-secondary border border-tm-border rounded-xl shadow-2xl w-full max-w-lg md:max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"
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
                        <p className="text-[14px] text-zinc-500 italic">No AI analysis available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
