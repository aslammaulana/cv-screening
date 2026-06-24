import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Apply Now",
};

export default function ApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
