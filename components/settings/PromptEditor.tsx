"use client";

interface PromptEditorProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    rows?: number;
}

export default function PromptEditor({
    label,
    value,
    onChange,
    rows = 6,
}: PromptEditorProps) {
    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-sm font-bold text-gray-900 ml-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-700 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 resize-y transition-all hover:border-gray-300"
            />
        </div>
    );
}
