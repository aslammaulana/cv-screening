"use client";

import { RiSearchLine, RiFilter3Line } from "react-icons/ri";

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

interface FilterBarProps {
    filter: { search: string; position: string; status: string };
    setFilter: (f: any) => void;
}

export default function FilterBar({ filter, setFilter }: FilterBarProps) {
    return (
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
            <div className="relative w-full md:w-96">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm text-gray-500 min-w-max">
                    <RiFilter3Line />
                    <span>Filter:</span>
                </div>
                <select
                    className="flex-1 md:w-48 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                >
                    {STATUSES.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
