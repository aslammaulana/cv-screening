interface DashboardHeaderProps {
    title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-md">
                Admin
            </span>
        </header>
    );
}
