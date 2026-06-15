"use client";

import { useState } from "react";
import { RiSearchLine } from "react-icons/ri";

interface FilterBarProps {
    filter: { search: string; position: string; status: string };
    setFilter: (f: any) => void;
    onDeleteSelected?: () => void;
    selectedCount?: number;
}

export default function FilterBar({ filter, setFilter, onDeleteSelected, selectedCount = 0 }: FilterBarProps) {
    const [showSearch, setShowSearch] = useState(false);

    return (
        <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-3 bg-zinc-900/30">
            <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${showSearch || filter.search
                    ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                    : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    }`}
            >
                <RiSearchLine className="text-sm" />
            </button>

            {showSearch && (
                <div className="relative flex-1 max-w-xs animate-in slide-in-from-left-2 duration-200">
                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full pl-9 pr-4 py-2 bg-zinc-950/50 border border-zinc-800/50 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition-all"
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                </div>
            )}

            {selectedCount > 0 && (
                <button
                    onClick={onDeleteSelected}
                    className="px-4 py-2 bg-red-600 border border-red-500 rounded-lg text-xs font-bold text-white hover:bg-red-500 transition-all cursor-pointer shadow-lg shadow-red-900/20"
                >
                    Delete selected
                </button>
            )}
        </div>
    );
}
