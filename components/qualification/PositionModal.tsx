"use client";

import { useEffect, useState } from "react";
import { Position } from "@/lib/data/positions";
import { RiCloseLine } from "react-icons/ri";

type FormData = Omit<Position, "id">;

const defaultForm: FormData = {
    title: "",
    is_active: true,
    must_have: "",
    nice_to_have: "",
    auto_reject_below: 50,
    manual_review_min: 51,
    manual_review_max: 85,
    auto_approve_above: 86,
    weight_skill: 30,
    weight_experience: 35,
    weight_project: 20,
    weight_education: 15,
    focus_points: "",
    red_flags: "",
};

interface PositionModalProps {
    open: boolean;
    editTarget: Position | null;
    onClose: () => void;
    onSave: (data: FormData, id?: string) => void;
}

export default function PositionModal({
    open,
    editTarget,
    onClose,
    onSave,
}: PositionModalProps) {
    const [form, setForm] = useState<FormData>(defaultForm);

    useEffect(() => {
        if (!open) return;

        if (editTarget) {
            const { id, ...rest } = editTarget;
            // Only update if title differs or it's a different record (id)
            setForm(prev => {
                if (prev.title === rest.title && prev.must_have === rest.must_have) return prev;
                return rest as FormData;
            });
        } else {
            setForm(prev => {
                if (prev.title === "" && prev.must_have === "") return prev;
                return defaultForm;
            });
        }
    }, [editTarget, open]);

    const totalWeight =
        form.weight_skill + form.weight_experience + form.weight_project + form.weight_education;

    const thresholdsValid =
        form.auto_reject_below < form.manual_review_min &&
        form.manual_review_min < form.manual_review_max &&
        form.manual_review_max < form.auto_approve_above;

    const isValid = form.title.trim() !== "" && totalWeight === 100 && thresholdsValid;

    const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = () => {
        if (!isValid) return;
        onSave(form, editTarget?.id);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-tm-secondary border border-tm-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/80 bg-zinc-950/20">
                    <h2 className="font-bold text-white text-lg tracking-tight">
                        {editTarget ? "Edit Position" : "Add Position"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer">
                        <RiCloseLine className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 py-6 space-y-6 overflow-y-auto scrollbar-thin">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Position Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Web Developer"
                            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 leading-none">Status</label>
                        <div className="flex gap-3">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    onClick={() => set("is_active", val)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${form.is_active === val
                                        ? val
                                            ? "border-green-500/50 bg-green-500/10 text-green-400"
                                            : "border-zinc-600 bg-zinc-800 text-zinc-400"
                                        : "border-zinc-800 bg-transparent text-zinc-600 hover:border-zinc-700"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${val ? (form.is_active === val ? "bg-green-400" : "bg-zinc-600") : (form.is_active === val ? "bg-zinc-400" : "bg-zinc-600")}`} />
                                    {val ? "Active" : "Inactive"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {/* Must Have / Nice to Have */}
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Must Have Requirements</label>
                            <textarea
                                rows={3}
                                value={form.must_have}
                                onChange={(e) => set("must_have", e.target.value)}
                                placeholder="Describe critical skills..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Nice to Have Requirements</label>
                            <textarea
                                rows={2}
                                value={form.nice_to_have}
                                onChange={(e) => set("nice_to_have", e.target.value)}
                                placeholder="Additional beneficial skills..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Score Thresholds */}
                    <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 leading-none">Scoring Thresholds</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Reject &lt;</span>
                                <input
                                    type="number"
                                    value={form.auto_reject_below}
                                    onChange={(e) => set("auto_reject_below", Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-red-400 font-mono focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Review Range</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={form.manual_review_min}
                                        onChange={(e) => set("manual_review_min", Number(e.target.value))}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                    <span className="text-zinc-700">/</span>
                                    <input
                                        type="number"
                                        value={form.manual_review_max}
                                        onChange={(e) => set("manual_review_max", Number(e.target.value))}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Approve &gt;</span>
                                <input
                                    type="number"
                                    value={form.auto_approve_above}
                                    onChange={(e) => set("auto_approve_above", Number(e.target.value))}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-green-400 font-mono focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                        </div>
                        {!thresholdsValid && (
                            <p className="text-[10px] text-red-500 mt-2 font-bold italic">
                                Thresholds must be sequential: Reject &lt; MR Min &lt; MR Max &lt; Approve
                            </p>
                        )}
                    </div>

                    {/* Scoring Weights */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Scoring Distribution</label>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${totalWeight === 100 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                ∑ {totalWeight}% {totalWeight === 100 ? "✓" : "(Required 100%)"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            {(
                                [
                                    ["Skills", "weight_skill", "bg-blue-500"],
                                    ["Experience", "weight_experience", "bg-purple-500"],
                                    ["Projects", "weight_project", "bg-cyan-500"],
                                    ["Education", "weight_education", "bg-emerald-500"],
                                ] as [string, keyof FormData, string][]
                            ).map(([label, key, color]) => (
                                <div key={key} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${color}/50`}></span>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={form[key] as number}
                                            onChange={(e) => set(key, Number(e.target.value))}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-zinc-600 transition-all"
                                        />
                                        <span className="text-xs text-zinc-700">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Focus Points & Red Flags */}
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Focus Points (AI Insights)</label>
                            <textarea
                                rows={2}
                                value={form.focus_points}
                                onChange={(e) => set("focus_points", e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 leading-none">Red Flags (Auto Penalty)</label>
                            <textarea
                                rows={2}
                                value={form.red_flags}
                                onChange={(e) => set("red_flags", e.target.value)}
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 px-8 py-5 border-t border-zinc-800/80 bg-zinc-900/20">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="px-8 py-2.5 text-sm font-bold text-black bg-white rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-lg cursor-pointer"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
}
