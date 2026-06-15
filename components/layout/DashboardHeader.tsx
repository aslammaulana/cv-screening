interface DashboardHeaderProps {
    title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="bg-tm-background border-b-2 border-tm-border px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-sm font-medium px-3 py-1 rounded-md">
                Admin
            </span>
        </header>
    );
}
