"use client";

import { Position } from "@/lib/data/positions";
import { RiEditLine, RiToggleLine, RiToggleFill } from "react-icons/ri";

interface PositionCardProps {
    position: Position;
    onEdit: (position: Position) => void;
    onToggleActive: (id: string) => void;
}

export default function PositionCard({
    position,
    onEdit,
    onToggleActive,
}: PositionCardProps) {
    const totalWeight =
        position.weight_skill +
        position.weight_experience +
        position.weight_project +
        position.weight_education;

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-base">{position.title}</h3>
                <span
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${position.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${position.is_active ? "bg-green-500" : "bg-gray-400"
                            }`}
                    />
                    {position.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            <hr className="border-gray-100 mb-4" />

            {/* Body */}
            <div className="space-y-3 mb-4">
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Must Have</p>
                    <p className="text-sm text-gray-700">{position.must_have}</p>
                </div>
                {position.nice_to_have && (
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Nice to Have</p>
                        <p className="text-sm text-gray-700">{position.nice_to_have}</p>
                    </div>
                )}
            </div>

            {/* Thresholds & Weights */}
            <div className="grid grid-cols-2 gap-4 mb-5 p-3 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Score Thresholds</p>
                    <p className="text-xs text-gray-600">
                        Reject &lt; <span className="font-semibold text-gray-800">{position.auto_reject_below}</span>
                        &nbsp;·&nbsp;
                        Review <span className="font-semibold text-gray-800">{position.manual_review_min}–{position.manual_review_max}</span>
                        &nbsp;·&nbsp;
                        Approve &gt; <span className="font-semibold text-gray-800">{position.auto_approve_above}</span>
                    </p>
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Scoring Weights</p>
                    <p className="text-xs text-gray-600">
                        Skill <span className="font-semibold text-gray-800">{position.weight_skill}%</span>
                        &nbsp;·&nbsp;
                        Exp <span className="font-semibold text-gray-800">{position.weight_experience}%</span>
                        &nbsp;·&nbsp;
                        Project <span className="font-semibold text-gray-800">{position.weight_project}%</span>
                        &nbsp;·&nbsp;
                        Edu <span className="font-semibold text-gray-800">{position.weight_education}%</span>
                        &nbsp;
                        <span className={totalWeight === 100 ? "text-green-600" : "text-red-500"}>
                            = {totalWeight}%
                        </span>
                    </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => onEdit(position)}
                    className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                >
                    <RiEditLine className="text-sm" />
                    Edit
                </button>
                <button
                    onClick={() => onToggleActive(position.id)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border transition-colors ${position.is_active
                            ? "text-red-600 border-red-200 hover:bg-red-50"
                            : "text-green-600 border-green-200 hover:bg-green-50"
                        }`}
                >
                    {position.is_active ? (
                        <><RiToggleFill className="text-sm" /> Deactivate</>
                    ) : (
                        <><RiToggleLine className="text-sm" /> Activate</>
                    )}
                </button>
            </div>
        </div>
    );
}
