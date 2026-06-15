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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-900">
                        {editTarget ? "Edit Position" : "Add Position"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <RiCloseLine className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Position Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            placeholder="e.g. Web Developer"
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                        <div className="flex gap-3">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    onClick={() => set("is_active", val)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${form.is_active === val
                                        ? val
                                            ? "border-green-500 bg-green-50 text-green-700"
                                            : "border-gray-400 bg-gray-100 text-gray-600"
                                        : "border-gray-200 text-gray-400"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${val ? "bg-green-500" : "bg-gray-400"}`} />
                                    {val ? "Active" : "Inactive"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Must Have / Nice to Have */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Must Have</label>
                        <textarea
                            rows={3}
                            value={form.must_have}
                            onChange={(e) => set("must_have", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nice to Have</label>
                        <textarea
                            rows={2}
                            value={form.nice_to_have}
                            onChange={(e) => set("nice_to_have", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Score Thresholds */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Score Thresholds</label>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-28 text-xs">Auto Reject below</span>
                                <input
                                    type="number"
                                    value={form.auto_reject_below}
                                    onChange={(e) => set("auto_reject_below", Number(e.target.value))}
                                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-28 text-xs">Manual Review</span>
                                <input
                                    type="number"
                                    value={form.manual_review_min}
                                    onChange={(e) => set("manual_review_min", Number(e.target.value))}
                                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-400 text-xs">–</span>
                                <input
                                    type="number"
                                    value={form.manual_review_max}
                                    onChange={(e) => set("manual_review_max", Number(e.target.value))}
                                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="w-28 text-xs">Auto Approve above</span>
                                <input
                                    type="number"
                                    value={form.auto_approve_above}
                                    onChange={(e) => set("auto_approve_above", Number(e.target.value))}
                                    className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        {!thresholdsValid && (
                            <p className="text-xs text-red-500 mt-1">
                                Thresholds harus berurutan: Reject &lt; MR Min &lt; MR Max &lt; Approve
                            </p>
                        )}
                    </div>

                    {/* Scoring Weights */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-700">Scoring Weights</label>
                            <span className={`text-xs font-medium ${totalWeight === 100 ? "text-green-600" : "text-red-500"}`}>
                                Total: {totalWeight}% {totalWeight === 100 ? "✓" : "(must be 100%)"}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {(
                                [
                                    ["Skill", "weight_skill"],
                                    ["Experience", "weight_experience"],
                                    ["Project Quality", "weight_project"],
                                    ["Education", "weight_education"],
                                ] as [string, keyof FormData][]
                            ).map(([label, key]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 w-24">{label}</span>
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={form[key] as number}
                                        onChange={(e) => set(key, Number(e.target.value))}
                                        className="w-14 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-xs text-gray-400">%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Focus Points & Red Flags */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Focus Points</label>
                        <textarea
                            rows={2}
                            value={form.focus_points}
                            onChange={(e) => set("focus_points", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Red Flags</label>
                        <textarea
                            rows={2}
                            value={form.red_flags}
                            onChange={(e) => set("red_flags", e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Save Position
                    </button>
                </div>
            </div>
        </div>
    );
}
