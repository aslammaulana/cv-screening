"use client";

import { useEffect, useState, useRef } from "react";
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
    focus_points: "",
    red_flags: "",
};

// ── Tooltip Component ──────────────────────────────────────────
function Tooltip({ text, example }: { text: string; example?: string }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative inline-flex items-center">
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="w-3.5 h-3.5 rounded-full bg-zinc-700 hover:bg-zinc-500 text-zinc-300 text-[9px] font-black flex items-center justify-center leading-none transition-colors cursor-pointer select-none"
                aria-label="Info"
            >
                !
            </button>
            {visible && (
                <div className="absolute top-0 left-5 mb-3 z-[100] w-64 bg-[#171717] border border-white/30 rounded-md shadow-2xl p-3.5 text-left">
                    <p className="text-[11px] text-zinc-200 leading-relaxed">{text}</p>
                    {example && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Example</span>
                            <p className="text-[11px] text-blue-400 mt-0.5 leading-relaxed italic">{example}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Label with Tooltip ─────────────────────────────────────────
function FieldLabel({ children, tooltip, example }: { children: React.ReactNode; tooltip: string; example?: string }) {
    return (
        <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[12px] font-medium text-white/90  ">{children}</span>
            <Tooltip text={tooltip} example={example} />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────

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

    const thresholdsValid =
        form.auto_reject_below < form.manual_review_min &&
        form.manual_review_min < form.manual_review_max &&
        form.manual_review_max < form.auto_approve_above;

    const isValid = form.title.trim() !== "" && thresholdsValid;

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
            <div className="relative bg-[#1F1F1F] border border-tm-border rounded-xl  w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 md:px-8 md:py-5 border-b border-zinc-800/80 bg-[#0F0F0E]">
                    <h2 className="font-bold text-white text-lg tracking-tight">
                        {editTarget ? "Edit Position" : "Add Position"}
                    </h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/80 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all cursor-pointer">
                        <RiCloseLine className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 md:px-8 md:py-6 space-y-6 overflow-y-auto scrollbar-thin">
                    {/* Title */}
                    <div>
                        <FieldLabel
                            tooltip="The job title for the recruitment. AI will use this as primary context when evaluating candidates."
                            example="Web Developer, Senior Accountant, Marketing Manager"
                        >
                            Position Title
                        </FieldLabel>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Web Developer"
                            className="w-full bg-[#171717] border border-white/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring focus:ring-white/30"
                        />
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <FieldLabel
                            tooltip="Determines if this position is still open for applications. Inactive positions will not appear in the registration form."
                            example="Active = currently open for applications. Inactive = recruitment temporarily closed."
                        >
                            Status
                        </FieldLabel>
                        <div className="flex gap-3">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    onClick={() => set("is_active", val)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all border cursor-pointer ${form.is_active === val
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
                        {/* Must Have */}
                        <div>
                            <FieldLabel
                                tooltip="MANDATORY requirements for the candidate. If these are not met, AI will automatically reject regardless of the score."
                                example="e.g. Bachelor's in CS, min 2 years React.js, previous experience in tech companies"
                            >
                                Must Have Requirements
                            </FieldLabel>
                            <textarea
                                rows={3}
                                value={form.must_have}
                                onChange={(e) => set("must_have", e.target.value)}
                                placeholder="Describe critical skills..."
                                className="w-full bg-[#171717] border border-white/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring focus:ring-white/30 transition-all resize-none"
                            />
                        </div>
                        {/* Nice to Have */}
                        <div>
                            <FieldLabel
                                tooltip="Optional advantages that boost a candidate's value to the AI. Candidates without these can still pass if they meet Must Have requirements."
                                example="e.g. Familiar with Docker, open source contributions, startup experience"
                            >
                                Nice to Have Requirements
                            </FieldLabel>
                            <textarea
                                rows={2}
                                value={form.nice_to_have}
                                onChange={(e) => set("nice_to_have", e.target.value)}
                                placeholder="Additional beneficial skills..."
                                className="w-full bg-[#171717] border border-white/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring focus:ring-white/30 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Score Thresholds */}
                    <div className="p-4 bg-[#171717] border border-white/30 rounded-xl">
                        <FieldLabel
                            tooltip="Score limits (0–100) for automatic status determination after AI scoring."
                            example="Reject < 50 → auto-rejected. 51–85 → manual HR review. > 86 → auto-approved."
                        >
                            Scoring Thresholds
                        </FieldLabel>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Reject &lt;</span>
                                <input
                                    type="number"
                                    value={form.auto_reject_below}
                                    onChange={(e) => set("auto_reject_below", Number(e.target.value))}
                                    className="w-full bg-[#0F0F0E] border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-red-400 font-mono focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Review Range</span>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={form.manual_review_min}
                                        onChange={(e) => set("manual_review_min", Number(e.target.value))}
                                        className="w-full bg-[#0F0F0E] border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                    <span className="text-zinc-700">/</span>
                                    <input
                                        type="number"
                                        value={form.manual_review_max}
                                        onChange={(e) => set("manual_review_max", Number(e.target.value))}
                                        className="w-full bg-[#0F0F0E] border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Approve &gt;</span>
                                <input
                                    type="number"
                                    value={form.auto_approve_above}
                                    onChange={(e) => set("auto_approve_above", Number(e.target.value))}
                                    className="w-full bg-[#0F0F0E] border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-green-400 font-mono focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                        </div>
                        {!thresholdsValid && (
                            <p className="text-[10px] text-red-500 mt-2 font-bold italic">
                                Thresholds must be sequential: Reject &lt; MR Min &lt; MR Max &lt; Approve
                            </p>
                        )}
                    </div>

                    {/* Focus Points & Red Flags */}
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <FieldLabel
                                tooltip="Specific items for AI to prioritize. AI will give more weight to these aspects during evaluation."
                                example="e.g. Personal real-world projects, team leadership, live product contributions"
                            >
                                Focus Points (AI Insights)
                            </FieldLabel>
                            <textarea
                                rows={2}
                                value={form.focus_points}
                                onChange={(e) => set("focus_points", e.target.value)}
                                className="w-full bg-[#171717] border border-white/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring focus:ring-white/30 transition-all resize-none"
                            />
                        </div>
                        <div>
                            <FieldLabel
                                tooltip="Warnings that will significantly lower a candidate's score. Finding these triggers an auto-penalty."
                                example="e.g. No work experience, irrelevant CV, unexplained employment gaps"
                            >
                                Red Flags (Auto Penalty)
                            </FieldLabel>
                            <textarea
                                rows={2}
                                value={form.red_flags}
                                onChange={(e) => set("red_flags", e.target.value)}
                                className="w-full bg-[#171717] border border-white/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring focus:ring-white/30 transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-8 md:py-5 border-t border-white/30 bg-[#0F0F0E]">
                    <button
                        onClick={onClose}
                        className=" py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="px-8 py-2.5 text-sm font-bold text-black bg-white rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-lg cursor-pointer"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
