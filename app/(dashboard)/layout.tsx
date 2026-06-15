import AppSidebar from "@/components/layout/AppSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <AppSidebar />
            <div className="flex flex-col flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}
