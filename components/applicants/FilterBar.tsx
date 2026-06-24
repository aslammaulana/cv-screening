"use client";

import { useState } from "react";
import { RiSearchLine, RiRestartLine, RiArrowUpDownLine, RiSparklingLine } from "react-icons/ri";
import { FiTable } from "react-icons/fi";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


interface FilterBarProps {
    filter: { search: string; position: string; status: string };
    setFilter: (f: any) => void;
    onDeleteSelected?: () => void;
    selectedCount?: number;
    onRefresh?: () => void;
    onResetSort?: () => void;
    isSorted?: boolean;
    isLoading?: boolean;
    onBatchProcess?: () => void;
    isBatchProcessing?: boolean;
    batchProgress?: { current: number; total: number };
}

export default function FilterBar({
    filter,
    setFilter,
    onDeleteSelected,
    selectedCount = 0,
    onRefresh,
    onResetSort,
    isSorted = false,
    isLoading = false,
    onBatchProcess,
    isBatchProcessing = false,
    batchProgress
}: FilterBarProps) {
    return (
        <div className="px-4 py-3 border-b border-[#3d3d3d] flex items-center justify-between gap-3 bg-[#0F0F0F]">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative w-full max-w-xs">
                    {isLoading ? (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    )}
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 bg-[#1F1F1F] border border-[#3d3d3d] rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all font-medium"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                </div>

                {isSorted && (
                    <button
                        onClick={onResetSort}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] border border-[#3d3d3d] rounded-lg text-xs font-medium text-white/90 hover:bg-[#313131] hover:border-zinc-700 transition-all cursor-pointer"
                    >
                        <RiArrowUpDownLine className="text-zinc-500" />
                        Newest
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {selectedCount > 0 ? (
                    <button
                        onClick={onDeleteSelected}
                        className="px-3 py-1.5 bg-[#541c15b7] border border-[#79281c] rounded-lg text-xs font-medium text-white hover:bg-[#69261d] transition-all cursor-pointer "
                    >
                        Delete {selectedCount} {selectedCount === 1 ? "row" : "rows"}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onBatchProcess}
                            disabled={isBatchProcessing}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-medium transition-all cursor-pointer disabled:cursor-not-allowed",
                                isBatchProcessing
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                    : "bg-[#1F1F1F] border-[#3d3d3d] text-white/90 hover:bg-[#313131] hover:border-zinc-700"
                            )}
                        >
                            {isBatchProcessing ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    Processing {batchProgress ? `(${batchProgress.current}/${batchProgress.total})` : ""}
                                </>
                            ) : (
                                <>
                                    <RiSparklingLine className="text-blue-400" />
                                    Batch Process
                                </>
                            )}
                        </button>

                        <a
                            href="https://docs.google.com/spreadsheets/d/1-6k0QQZ3DkcxVD9hEUEXUvYLnZzDOENYo0QgcU0pTBk/edit?gid=0#gid=0"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-[#1F1F1F] border border-[#3d3d3d] rounded-lg text-xs font-medium text-white/90 hover:bg-[#313131] hover:border-zinc-700 transition-all cursor-pointer"
                        >
                            <FiTable className="text-zinc-500" />
                            Spreadsheets
                        </a>


                        <button
                            onClick={onRefresh}
                            title="Refresh data"
                            className="p-2 bg-[#1F1F1F] border border-[#3d3d3d] rounded-lg font-medium text-white/90 hover:bg-[#313131] hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-center"
                        >
                            <RiRestartLine size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
