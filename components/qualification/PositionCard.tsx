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
    return (
        <div className="bg-tm-secondary border border-tm-border rounded-2xl p-6 transition-all duration-300 hover:border-zinc-700 shadow-xl group">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg tracking-tight">{position.title}</h3>
                <span
                    className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border transition-colors ${position.is_active
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                        }`}
                >
                    <span
                        className={`w-1 h-1 rounded-full ${position.is_active ? "bg-green-400" : "bg-zinc-600"
                            }`}
                    />
                    {position.is_active ? "Active" : "Inactive"}
                </span>
            </div>

            <hr className="border-zinc-800/50 mb-5" />

            {/* Body */}
            <div className="space-y-4 mb-6">
                <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 leading-none">Must Have</p>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">{position.must_have}</p>
                </div>
                {position.nice_to_have && (
                    <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 leading-none">Nice to Have</p>
                        <p className="text-sm text-zinc-400 leading-relaxed">{position.nice_to_have}</p>
                    </div>
                )}
            </div>

            {/* Thresholds Summary Panel */}
            <div className="space-y-3 mb-6 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl relative overflow-hidden">
                <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Score Thresholds</p>
                        <div className="flex flex-wrap gap-y-2 gap-x-4 items-center">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-600 font-medium">Reject</span>
                                <span className="text-xs text-red-400 font-mono font-bold">&lt;{position.auto_reject_below}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-800"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-600 font-medium">Review</span>
                                <span className="text-xs text-amber-400 font-mono font-bold">{position.manual_review_min}–{position.manual_review_max}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-800"></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-600 font-medium">Approve</span>
                                <span className="text-xs text-green-400 font-mono font-bold">&gt;{position.auto_approve_above}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onEdit(position)}
                        className="flex items-center gap-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-lg transition-all cursor-pointer"
                    >
                        <RiEditLine className="text-sm opacity-70" />
                        Edit Settings
                    </button>
                    <button
                        onClick={() => onToggleActive(position.id)}
                        className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer ${position.is_active
                            ? "text-zinc-500 border-zinc-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
                            : "text-green-400 border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                            }`}
                    >
                        {position.is_active ? (
                            <><RiToggleFill className="text-sm opacity-70" /> Pause</>
                        ) : (
                            <><RiToggleLine className="text-sm opacity-70" /> Resume</>
                        )}
                    </button>
                </div>

                <div className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-tight">
                    Last Updated: {position.updated_at ? new Date(position.updated_at).toLocaleDateString() : 'N/A'}
                </div>
            </div>
        </div>
    );
}
