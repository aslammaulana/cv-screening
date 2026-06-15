import Link from "next/link";

interface MetricCardProps {
    title: string;
    value: number | string;
    href?: string;
}

export default function MetricCard({ title, value, href }: MetricCardProps) {
    const content = (
        <div className="bg-tm-secondary border border-tm-border rounded-xl p-6 hover:shadow-lg transition-all cursor-default">
            <p className="text-sm font-medium text-zinc-400 mb-3">{title}</p>
            <p className="text-4xl font-bold text-white">{value}</p>
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
