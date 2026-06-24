export type ApplicantStatus =
    | "pending"
    | "extracted"
    | "scoring"
    | "auto_approved"
    | "manual_review"
    | "auto_rejected"
    | "approved"
    | "rejected"
    | "failed";

export interface Applicant {
    id: string;
    nama: string;
    email: string;
    gender: "Male" | "Female";
    position: string;
    score_total: number;
    cv_url: string;
    status: ApplicantStatus;
    ai_reason_accept: string;
    extracted_cv?: string;
}

export const mockApplicants: Applicant[] = [
    {
        id: "1",
        nama: "John Doe",
        email: "john@email.com",
        gender: "Male",
        position: "Web Developer",
        score_total: 92,
        cv_url: "#",
        status: "auto_approved",
        ai_reason_accept: "Kandidat memiliki 3+ tahun pengalaman nyata di perusahaan produk, background React yang kuat, dan portfolio yang solid.",
    },
    {
        id: "2",
        nama: "Jane Smith",
        email: "jane@email.com",
        gender: "Female",
        position: "Accountant",
        score_total: 73,
        cv_url: "#",
        status: "manual_review",
        ai_reason_accept: "Pengalaman relevan 2 tahun di bidang akuntansi, familiar dengan laporan keuangan. Belum memiliki sertifikasi profesional yang disyaratkan.",
    },
    {
        id: "3",
        nama: "Bob Kusuma",
        email: "bob@email.com",
        gender: "Male",
        position: "Web Developer",
        score_total: 31,
        cv_url: "#",
        status: "auto_rejected",
        ai_reason_accept: "Tidak ada pengalaman kerja profesional. Portfolio tidak relevan dengan posisi yang dilamar.",
    },
    {
        id: "4",
        nama: "Siti Rahayu",
        email: "siti@email.com",
        gender: "Female",
        position: "Web Developer",
        score_total: 58,
        cv_url: "#",
        status: "manual_review",
        ai_reason_accept: "Pengalaman 1 tahun sebagai junior dev, familiar dengan React dasar. Pengalaman masih minim, portfolio kurang lengkap.",
    },
    {
        id: "5",
        nama: "Ahmad Fauzi",
        email: "ahmad@email.com",
        gender: "Male",
        position: "Accountant",
        score_total: 89,
        cv_url: "#",
        status: "auto_approved",
        ai_reason_accept: "5 tahun pengalaman di Big 4, memiliki sertifikasi CPA, track record yang sangat baik.",
    },
    {
        id: "6",
        nama: "Dewi Anjani",
        email: "dewi@email.com",
        gender: "Female",
        position: "Web Developer",
        score_total: 0,
        cv_url: "#",
        status: "failed",
        ai_reason_accept: "Gagal ekstrak CV — file corrupt atau format tidak didukung.",
    },
];
