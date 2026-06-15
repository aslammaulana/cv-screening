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
        className: "bg-green-100 text-green-700",
    },
    manual_review: {
        label: "Needs Review",
        className: "bg-amber-100 text-amber-700",
    },
    auto_rejected: {
        label: "Auto Rejected",
        className: "bg-red-100 text-red-700",
    },
    approved: {
        label: "Approved",
        className: "bg-green-100 text-green-700",
    },
    rejected: {
        label: "Rejected",
        className: "bg-red-100 text-red-700",
    },
    pending: {
        label: "Processing",
        className: "bg-gray-100 text-gray-600",
    },
    extracted: {
        label: "Extracted",
        className: "bg-gray-100 text-gray-600",
    },
    scoring: {
        label: "Scoring",
        className: "bg-blue-100 text-blue-700",
    },
    failed: {
        label: "Failed",
        className: "bg-white text-red-600 border border-red-300",
    },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const { label, className } = config[status] ?? config.pending;
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}
        >
            {label}
        </span>
    );
}
