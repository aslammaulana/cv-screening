interface DashboardHeaderProps {
    title: string;
    className?: string;
}

export default function DashboardHeader({ title, className }: DashboardHeaderProps) {
    return (
        <header className={`bg-tm-background border-b border-tm-border px-6 py-4.5 flex items-center justify-between ${className || ""}`}>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
        </header>
    );
}
