"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RiArrowDownSLine, RiUpload2Line, RiCheckLine, RiErrorWarningLine, RiLayoutMasonryLine } from "react-icons/ri";
import SelectPopover from "@/components/ui/SelectPopover";


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
            setError("Please Enter Your Name");
            return;
        }
        if (!formData.email) {
            setError("Please Enter Your Email");
            return;
        }
        if (!formData.posisi) {
            setError("Please Select a Position");
            return;
        }
        if (!formData.cv) {
            setError("Please Upload Your CV (PDF)");
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
                setError("File must be in PDF format");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("Maximum file size is 5MB");
                return;
            }
            setFormData({ ...formData, cv: file });
            setError(null);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-tm-background flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-[#1F1F1F] border border-tm-border rounded-xl p-12 text-center flex flex-col items-center">
                    <div className="w-13 h-13 bg-[#293B63] rounded-full flex items-center justify-center mb-6">
                        <RiCheckLine className="text-white text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Application Sent!</h2>
                    <p className="text-white/80 text-sm mb-8">
                        We have received your CV. We will send the results to your email soon.
                    </p>
                    <button
                        onClick={() => setIsSuccess(false)}
                        className="w-full bg-white text-black rounded-xl py-4 font-bold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-tm-background flex flex-col items-center justify-center p-6 font-sans text-white">
            <Link
                href="/dashboard"
                className="mb-6 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full text-[12px] font-medium text-white/90 hover:text-white transition-all"
            >

                
                Dashboard
            </Link>

            <div className="max-w-xl w-full bg-[#1F1F1F] border border-tm-border rounded-[10px]  p-12 relative overflow-hidden">
                {/* Decorative Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32  rounded-full -mr-16 -mt-16 pointer-events-none" />

                <div className="text-center mb-10 relative">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Recruitment Portal</h1>
                    <p className="text-white/80 text-sm">Complete your personal data to apply for this position</p>
                </div>


                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    {/* Nama */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="Example: John Doe"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="w-full bg-[#0F0F0E] border border-tm-border rounded-[10px] px-6 py-4 text-sm focus:outline-none focus:ring focus:ring-white/70  transition-all outline-none placeholder:text-white/50"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-[#0F0F0E] border border-tm-border rounded-[10px] px-6 py-4 text-sm focus:outline-none focus:ring focus:ring-white/70  transition-all outline-none placeholder:text-white/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Gender */}
                        <SelectPopover
                            label="Gender"
                            options={[
                                { id: "Male", label: "Male" },
                                { id: "Female", label: "Female" },
                            ]}
                            value={formData.gender}
                            onChange={(val: string) => setFormData({ ...formData, gender: val })}
                            placeholder="Select Gender"
                        />

                        {/* Posisi */}
                        <SelectPopover
                            label="Target Position"
                            options={positions.map((p) => ({ id: p.title, label: p.title }))}
                            value={formData.posisi}
                            onChange={(val: string) => setFormData({ ...formData, posisi: val })}
                            placeholder="Select Position"
                        />

                    </div>

                    {/* CV Upload */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-white/80 uppercase tracking-wider ml-1">Upload CV (PDF)</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full bg-[#0F0F0E] border border-dashed border-tm-border rounded-[10px] px-6 py-8 text-sm flex flex-col items-center justify-center gap-3 group-hover:border-white/80 transition-all ${formData.cv ? 'border-white/80 bg-blue-500/5' : ''}`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-colors ${formData.cv ? 'bg-blue-500/20 text-white' : 'bg-tm-secondary text-white/70'}`}>
                                    <RiUpload2Line className="text-2xl" />
                                </div>
                                <div className="text-center">
                                    <span className="text-white font-semibold">
                                        {formData.cv ? formData.cv.name : "Select your PDF file"}
                                    </span>
                                    <p className="text-white/60 text-xs mt-1">
                                        Max size 5MB (Format: PDF)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-[#541c1571] border border-[#79281c] rounded-lg p-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <RiErrorWarningLine className="text-white text-xl flex-shrink-0" />
                            <p className="text-xs font-semibold text-white leading-tight">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#293B63] text-white rounded-[10px] py-4.5 font-bold text-sm  hover:bg-[#30497e]  mt-4 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Processing...</span>
                            </>
                        ) : "Send Form"}
                    </button>


                </form>
            </div>
        </div>
    );

}
