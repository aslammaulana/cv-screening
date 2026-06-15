import { ApplicantStatus } from "@/lib/data/applicants";

interface StatusBadgeProps {
    status: ApplicantStatus;
}

const config: Record<
    ApplicantStatus,
    { label: string; className: string }
> = {
    auto_approved: {
        label: "Auto Approved",
        className: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
    manual_review: {
        label: "Needs Review",
        className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    auto_rejected: {
        label: "Auto Rejected",
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
    approved: {
        label: "Approved",
        className: "bg-green-500/10 text-green-400 border border-green-500/20",
    },
    rejected: {
        label: "Rejected",
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
    pending: {
        label: "Processing",
        className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
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
        className: "bg-red-500/10 text-red-400 border border-red-500/20",
    },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const { label, className } = config[status] ?? config.pending;
    return (
        <span
            className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm shadow-black/20 ${className}`}
        >
            {label}
        </span>
    );
}
