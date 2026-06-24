export interface Position {
    id: string;
    title: string;
    is_active: boolean;
    must_have: string;
    nice_to_have: string;
    auto_reject_below: number;
    manual_review_min: number;
    manual_review_max: number;
    auto_approve_above: number;
    focus_points: string;
    red_flags: string;
    created_at?: string;
    updated_at?: string;
}

export const mockPositions: Position[] = [
    {
        id: "1",
        title: "Web Developer",
        is_active: true,
        must_have: "Min. D3/S1 Informatika, 1 tahun pengalaman",
        nice_to_have: "React, Laravel",
        auto_reject_below: 50,
        manual_review_min: 51,
        manual_review_max: 85,
        auto_approve_above: 86,
        focus_points: "Portfolio projects, real-world experience",
        red_flags: "No practical experience, plagiarized portfolio",
    },
    {
        id: "2",
        title: "Accountant",
        is_active: true,
        must_have: "Min. S1 Akuntansi, berpengalaman dengan laporan keuangan",
        nice_to_have: "MYOB, SAP",
        auto_reject_below: 50,
        manual_review_min: 51,
        manual_review_max: 85,
        auto_approve_above: 86,
        focus_points: "Financial reporting accuracy",
        red_flags: "Gaps in employment, no relevant certifications",
    },
];
