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
        <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-300 bg-zinc-900/30 focus:bg-zinc-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 resize-y transition-all hover:border-zinc-700 placeholder-zinc-700"
            />
        </div>
    );
}
