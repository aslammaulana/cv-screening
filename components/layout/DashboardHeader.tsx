interface DashboardHeaderProps {
    title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="bg-tm-background border-b border-tm-border px-6 py-4.5 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            
        </header>
    );
}
