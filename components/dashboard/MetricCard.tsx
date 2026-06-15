import Link from "next/link";

interface MetricCardProps {
    title: string;
    value: number | string;
    href?: string;
}

export default function MetricCard({ title, value, href }: MetricCardProps) {
    const content = (
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow cursor-default">
            <p className="text-sm font-medium text-gray-500 mb-3">{title}</p>
            <p className="text-4xl font-bold text-gray-900">{value}</p>
        </div>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}
