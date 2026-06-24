import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Job Qualifications",
};

export default function QualificationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
