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
    score_skill: number;
    score_experience: number;
    score_project: number;
    score_education: number;
    ai_reason_accept: string;
    ai_reason_reject: string;
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
        score_skill: 88,
        score_experience: 95,
        score_project: 90,
        score_education: 85,
        ai_reason_accept:
            "Kandidat memiliki 3+ tahun pengalaman nyata di perusahaan produk, background React yang kuat, dan portfolio yang solid.",
        ai_reason_reject: "Tidak ada kelemahan signifikan yang ditemukan.",
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
        score_skill: 70,
        score_experience: 75,
        score_project: 68,
        score_education: 80,
        ai_reason_accept:
            "Pengalaman relevan 2 tahun di bidang akuntansi, familiar dengan laporan keuangan.",
        ai_reason_reject: "Belum memiliki sertifikasi profesional yang disyaratkan.",
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
        score_skill: 30,
        score_experience: 25,
        score_project: 35,
        score_education: 40,
        ai_reason_accept: "Memiliki gelar di bidang terkait.",
        ai_reason_reject:
            "Tidak ada pengalaman kerja profesional. Portfolio tidak relevan dengan posisi yang dilamar.",
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
        score_skill: 55,
        score_experience: 60,
        score_project: 52,
        score_education: 65,
        ai_reason_accept:
            "Pengalaman 1 tahun sebagai junior dev, familiar dengan React dasar.",
        ai_reason_reject: "Pengalaman masih minim, portfolio kurang lengkap.",
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
        score_skill: 85,
        score_experience: 92,
        score_project: 88,
        score_education: 90,
        ai_reason_accept:
            "5 tahun pengalaman di Big 4, memiliki sertifikasi CPA, track record yang sangat baik.",
        ai_reason_reject: "Tidak ada kelemahan signifikan.",
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
        score_skill: 0,
        score_experience: 0,
        score_project: 0,
        score_education: 0,
        ai_reason_accept: "",
        ai_reason_reject:
            "Gagal ekstrak CV — file corrupt atau format tidak didukung.",
    },
];
