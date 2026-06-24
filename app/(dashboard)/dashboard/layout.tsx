import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Analytics Dashboard",
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
