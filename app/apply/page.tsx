"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiArrowDownSLine, RiUpload2Line, RiCheckLine, RiErrorWarningLine } from "react-icons/ri";

export default function ApplyPage() {
    const [formData, setFormData] = useState({
        nama: "",
        email: "",
        gender: "Male",
        posisi: "",
        cv: null as File | null,
    });

    const [positions, setPositions] = useState<{ id: string; title: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch active positions
    useEffect(() => {
        fetch("/api/positions")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setPositions(data);
                }
            })
            .catch((err) => console.error("Failed to fetch positions:", err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.nama) {
            setError("Harap Masukkan Nama");
            return;
        }
        if (!formData.email) {
            setError("Harap Masukkan Email");
            return;
        }
        if (!formData.posisi) {
            setError("Harap Pilih Posisi");
            return;
        }
        if (!formData.cv) {
            setError("Harap Upload CV PDF");
            return;
        }

        setIsSubmitting(true);

        try {
            const body = new FormData();
            body.append("nama", formData.nama);
            body.append("email", formData.email);
            body.append("gender", formData.gender);
            body.append("posisi", formData.posisi);
            body.append("cv", formData.cv);

            const res = await fetch("/api/apply", {
                method: "POST",
                body,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to submit application");
            }

            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== "application/pdf") {
                setError("File harus berformat PDF");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Ukuran file maksimal 5MB");
                return;
            }
            setFormData({ ...formData, cv: file });
            setError(null);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-12 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <RiCheckLine className="text-green-600 text-4xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Terkirim!</h2>
                    <p className="text-gray-500 mb-8">
                        CV Anda telah kami terima. Kami akan mengirimkan hasilnya ke email Anda dalam waktu dekat.
                    </p>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="w-full bg-blue-600 text-white rounded-2xl py-4 font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-12 transform transition-all">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruitment PT. XYZ</h1>
                    <p className="text-gray-400 text-sm">Silahkan isi data dibawah</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nama */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 ml-1">Nama</label>
                        <input
                            type="text"
                            placeholder="Masukkan Nama Kamu.."
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 ml-1">Email</label>
                        <input
                            type="email"
                            placeholder="Input Email Kamu..."
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                        />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 ml-1">Gender</label>
                        <div className="relative">
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none cursor-pointer"
                            >
                                <option value="Male">Pria</option>
                                <option value="Female">Wanita</option>
                            </select>
                            <RiArrowDownSLine className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Posisi */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 ml-1">Posisi</label>
                        <div className="relative">
                            <select
                                value={formData.posisi}
                                onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                                className="w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none cursor-pointer"
                            >
                                <option value="" disabled>Pilih Posisi</option>
                                {positions.map((p) => (
                                    <option key={p.id} value={p.title}>
                                        {p.title}
                                    </option>
                                ))}
                            </select>
                            <RiArrowDownSLine className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none" />
                        </div>
                    </div>

                    {/* CV Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900 ml-1">Input CV PDF</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full bg-slate-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm flex items-center gap-4 group-hover:bg-gray-100 transition-all ${formData.cv ? 'bg-blue-50/50 border-blue-100' : ''}`}>
                                <span className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm whitespace-nowrap">
                                    Choose File
                                </span>
                                <span className="text-gray-400 truncate">
                                    {formData.cv ? formData.cv.name : "No file chosen"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[10px] text-gray-400 font-medium leading-relaxed px-1">
                        *Resume di upload dalam bentuk ATS dengan format PDF
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <RiErrorWarningLine className="text-yellow-600 text-xl flex-shrink-0" />
                            <p className="text-xs font-semibold text-yellow-600 leading-none">
                                *{error}
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#536bc4] text-white rounded-[20px] py-4 font-bold text-sm shadow-lg shadow-blue-500/20 hover:bg-[#4558a8] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </div>
        </div>
    );
}
