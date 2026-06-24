import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "All Applicants",
};

export default function AllApplicantsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
