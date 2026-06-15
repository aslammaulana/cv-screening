"use client";

import { useEffect, useRef } from "react";
import { Applicant } from "@/lib/data/applicants";
import { RiCloseLine, RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";

interface AIReasonPopoverProps {
    applicant: Applicant;
    onClose: () => void;
}

const ScoreBar = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 w-20 flex-shrink-0">{label}</span>
        <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
            <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${value}%` }}
            />
        </div>
        <span className="text-xs font-semibold text-zinc-200 w-6 text-right">{value}</span>
    </div>
);

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                ref={ref}
                className="relative bg-tm-secondary border border-tm-border rounded-xl shadow-2xl w-full max-w-xl mx-4 p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-white text-sm">AI Reasoning</h3>
                        <p className="text-xs text-zinc-400">{applicant.nama} · {applicant.position}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <RiCloseLine className="text-xl" />
                    </button>
                </div>

                <hr className="border-tm-border mb-4" />

                {/* Accept reason */}
                {applicant.ai_reason_accept && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <RiCheckboxCircleLine className="text-green-400 text-sm shrink-0" />
                            <span className="text-xs font-medium text-green-400">Diterima karena:</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed pl-5">
                            {applicant.ai_reason_accept}
                        </p>
                    </div>
                )}

                {/* Reject reason */}
                {applicant.ai_reason_reject && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <RiCloseCircleLine className="text-red-400 text-sm shrink-0" />
                            <span className="text-xs font-medium text-red-400">Catatan negatif:</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed pl-5">
                            {applicant.ai_reason_reject}
                        </p>
                    </div>
                )}

                {/* Score breakdown */}
                {applicant.score_total > 0 && (
                    <>
                        <hr className="border-tm-border mb-4" />
                        <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Score Breakdown</p>
                        <div className="space-y-3">
                            <ScoreBar label="Skill" value={applicant.score_skill} />
                            <ScoreBar label="Experience" value={applicant.score_experience} />
                            <ScoreBar label="Project" value={applicant.score_project} />
                            <ScoreBar label="Education" value={applicant.score_education} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
