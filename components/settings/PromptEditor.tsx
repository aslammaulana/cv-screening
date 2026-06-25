"use client";

interface PromptEditorProps {
    label: string;
    description?: string;
    value: string;
    onChange: (val: string) => void;
    rows?: number;
}

export default function PromptEditor({
    label,
    description,
    value,
    onChange,
    rows = 6,
}: PromptEditorProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="ml-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                {description && (
                    <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{description}</p>
                )}
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={rows}
                className="w-full border border-white/20 rounded-[10px] px-5 py-4 text-sm text-zinc-300 bg-[#171717] focus:outline-none focus:ring focus:ring-white/20  resize-y transition-all  placeholder-zinc-700"
            />
        </div>
    );
}
