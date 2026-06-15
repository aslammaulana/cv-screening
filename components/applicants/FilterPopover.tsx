"use client";

import { useEffect, useRef, useState } from "react";
import { RiCloseLine, RiCheckLine } from "react-icons/ri";

const STATUSES = [
    "All Status",
    "Pending",
    "Extracted",
    "Manual Review",
    "Auto Approved",
    "Auto Rejected",
    "Approved",
    "Rejected",
    "Failed"
];

const POSITIONS = [
    "All Positions",
    "Web Developer",
    "Backend Developer",
    "UI/UX Designer",
    "Mobile Developer",
    "Data Scientist"
];

interface FilterPopoverProps {
    filter: { position: string; status: string };
    setFilter: (f: any) => void;
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLButtonElement>;
}

export default function FilterPopover({ filter, setFilter, isOpen, onClose, triggerRef }: FilterPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(e.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handler);
        }
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="absolute top-12 left-0 z-50 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in duration-200"
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Filter Applicants</span>
                <button onClick={onClose} className="text-zinc-500 hover:text-white">
                    <RiCloseLine className="text-lg" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Status Filter */}
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</label>
                    <div className="grid grid-cols-1 gap-1">
                        {STATUSES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter({ ...filter, status: s })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${filter.status === s
                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                        : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
                                    }`}
                            >
                                <span>{s}</span>
                                {filter.status === s && <RiCheckLine />}
                            </button>
                        ))}
                    </div>
                </div>

                <hr className="border-zinc-800" />

                {/* Position Filter */}
                <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Position</label>
                    <div className="grid grid-cols-1 gap-1">
                        {POSITIONS.map((p) => (
                            <button
                                key={p}
                                onClick={() => setFilter({ ...filter, position: p })}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${filter.position === p
                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                        : "text-zinc-400 hover:bg-zinc-800 border border-transparent"
                                    }`}
                            >
                                <span>{p}</span>
                                {filter.position === p && <RiCheckLine />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
                <button
                    onClick={() => setFilter({ ...filter, status: "All Status", position: "All Positions" })}
                    className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}
