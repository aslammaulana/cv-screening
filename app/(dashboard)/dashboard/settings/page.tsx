"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PromptEditor from "@/components/settings/PromptEditor";
import { createClient } from "@/lib/supabase/client";
import { RiCheckLine, RiLoader4Line, RiInformationLine, RiCodeLine } from "react-icons/ri";

interface AIConfig {
    id: string;
    persona_prompt: string;
    scoring_prompt: string;
    updated_at: string;
}

export default function SettingsPage() {
    const [config, setConfig] = useState<AIConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<AIConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    const supabase = createClient();

    const fetchConfig = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("ai_config")
            .select("*")
            .single();

        if (!error && data) {
            setConfig({ ...data });
            setOriginalConfig({ ...data });
        }
        setIsLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        if (!config || !originalConfig) return;
        setIsSaving(true);
        setSaveStatus("idle");

        try {
            const { error: updateError } = await supabase
                .from("ai_config")
                .update({
                    persona_prompt: config.persona_prompt,
                    updated_at: new Date().toISOString()
                })
                .eq("id", config.id);

            if (updateError) throw updateError;

            setSaveStatus("success");
            setOriginalConfig({ ...config });
            setTimeout(() => setSaveStatus("idle"), 3000);
        } catch (err: any) {
            console.error("Save error:", err);
            setSaveStatus("error");
            alert("Failed to save: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
                <RiLoader4Line className="text-4xl animate-spin mb-4 text-white" />
                <p className="animate-pulse">Loading settings...</p>
            </div>
        );
    }
    return (
        <div className="pb-12 bg-tm-background min-h-screen">
            <DashboardHeader title="AI Configuration Settings" />

            <main className="p-4 md:p-8 w-full space-y-12">
                {/* AI Persona Setup - Full Width */}
                <section className="space-y-6">
                    <div className="flex items-center justify-end pb-2 ">

                        <button
                            onClick={handleSave}
                            disabled={isSaving || !config || config.persona_prompt === originalConfig?.persona_prompt}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-[14px] font-bold transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed cursor-pointer ${saveStatus === "success"
                                ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                                : "bg-white hover:bg-zinc-200 text-black shadow-xl"
                                }`}
                        >
                            {isSaving ? (
                                <RiLoader4Line className="animate-spin text-xl" />
                            ) : saveStatus === "success" ? (
                                <RiCheckLine className="text-lg" />
                            ) : null}
                            {isSaving ? "Saving..." : saveStatus === "success" ? "Saved" : "Save Changes"}
                        </button>
                    </div>

                    <div className="bg-[#1F1F1F] border border-tm-border rounded-[10px] p-5 md:p-10 relative overflow-hidden group">


                        <PromptEditor
                            label=""
                            value={config?.persona_prompt || ""}
                            onChange={(val) => config && setConfig({ ...config, persona_prompt: val })}
                            rows={10}
                        />

                        <div className="mt-8 flex items-center gap-3 text-zinc-500 bg-[#171717] p-4 rounded-[10px] border border-white/20">
                            <RiCodeLine className="text-xl shrink-0" />
                            <p className="text-xs font-medium">
                                Note: Scoring Prompt is managed via <code className="text-blue-400 font-mono">lib/ai/config.ts</code> for evaluation criteria security.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
