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
        <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${value}%` }}
            />
        </div>
        <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
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
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <div
                ref={ref}
                className="relative bg-white border border-gray-200 rounded-xl shadow-xl w-full max-w-xl mx-4 p-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">AI Reasoning</h3>
                        <p className="text-xs text-gray-400">{applicant.nama} · {applicant.position}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <RiCloseLine className="text-lg" />
                    </button>
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* Accept reason */}
                {applicant.ai_reason_accept && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <RiCheckboxCircleLine className="text-green-500 text-sm flex-shrink-0" />
                            <span className="text-xs font-medium text-green-700">Diterima karena:</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pl-5">
                            {applicant.ai_reason_accept}
                        </p>
                    </div>
                )}

                {/* Reject reason */}
                {applicant.ai_reason_reject && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <RiCloseCircleLine className="text-red-500 text-sm flex-shrink-0" />
                            <span className="text-xs font-medium text-red-700">Catatan negatif:</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pl-5">
                            {applicant.ai_reason_reject}
                        </p>
                    </div>
                )}

                {/* Score breakdown */}
                {applicant.score_total > 0 && (
                    <>
                        <hr className="border-gray-100 mb-3" />
                        <p className="text-xs font-medium text-gray-500 mb-3">Score Breakdown</p>
                        <div className="space-y-2">
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
