import { ApplicantStatus } from "@/lib/data/applicants";
import { RiLoader4Line } from "react-icons/ri";

interface StatusBadgeProps {
    status: ApplicantStatus;
    isProcessing?: boolean;
}


const config: Record<
    ApplicantStatus,
    { label: string; className: string }
> = {
    auto_approved: {
        label: "Auto Approved",
        className: "bg-[#2566426e] text-white border border-[#226942b7]",
    },
    manual_review: {
        label: "Needs Review",
        className: "bg-[#b489255d] text-white border border-[#b489259a]",
    },
    auto_rejected: {
        label: "Auto Rejected",
        className: "bg-[#541c15b7] text-white border border-[#79281c]",
    },
    approved: {
        label: "Approved",
        className: "bg-[#2566426e] text-white border border-[#226942b7]",
    },
    rejected: {
        label: "Rejected",
        className: "bg-[#541c15b7] text-white border border-[#79281c]",
    },
    pending: {
        label: "Processing",
        className: "bg-zinc-500/10 text-white border border-zinc-500/20",
    },
    extracted: {
        label: "Extracted",
        className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
    },
    scoring: {
        label: "Scoring",
        className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    failed: {
        label: "Failed",
        className: "bg-[#541c15b7] text-white border border-[#79281c]",
    },
};

export default function StatusBadge({ status, isProcessing }: StatusBadgeProps) {
    if (isProcessing) {
        return (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm shadow-black/20 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <RiLoader4Line className="animate-spin text-sm" />
                In Progress
            </span>
        );
    }

    const { label, className } = config[status] ?? config.pending;
    return (
        <span
            className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm shadow-black/20 ${className}`}
        >
            {label}
        </span>
    );
}

