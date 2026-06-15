"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PromptEditor from "@/components/settings/PromptEditor";
import { createClient } from "@/lib/supabase/client";
import { RiHistoryLine, RiCheckLine, RiLoader4Line } from "react-icons/ri";

interface AIConfig {
    id: string;
    persona_prompt: string;
    extraction_prompt: string;
    scoring_prompt: string;
    updated_at: string;
}

interface HistoryItem {
    id: string;
    prompt_type: string;
    previous_value: string;
    new_value: string;
    changed_at: string;
}

export default function SettingsPage() {
    const [config, setConfig] = useState<AIConfig | null>(null);
    const [originalConfig, setOriginalConfig] = useState<AIConfig | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
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

    const fetchHistory = useCallback(async () => {
        const { data, error } = await supabase
            .from("ai_config_history")
            .select("*")
            .order("changed_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setHistory(data);
        }
    }, [supabase]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchConfig();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchHistory();
    }, [fetchConfig, fetchHistory]);

    const handleSave = async () => {
        if (!config || !originalConfig) return;
        setIsSaving(true);
        setSaveStatus("idle");

        try {
            // 1. Update main config
            const { error: updateError } = await supabase
                .from("ai_config")
                .update({
                    persona_prompt: config.persona_prompt,
                    extraction_prompt: config.extraction_prompt,
                    scoring_prompt: config.scoring_prompt,
                    updated_at: new Date().toISOString()
                })
                .eq("id", config.id);

            if (updateError) throw updateError;

            // 2. Identify and log changes in history
            const changes = [];
            if (config.persona_prompt !== originalConfig.persona_prompt) {
                changes.push({
                    prompt_type: "persona",
                    previous_value: originalConfig.persona_prompt,
                    new_value: config.persona_prompt
                });
            }
            if (config.extraction_prompt !== originalConfig.extraction_prompt) {
                changes.push({
                    prompt_type: "extraction",
                    previous_value: originalConfig.extraction_prompt,
                    new_value: config.extraction_prompt
                });
            }
            if (config.scoring_prompt !== originalConfig.scoring_prompt) {
                changes.push({
                    prompt_type: "scoring",
                    previous_value: originalConfig.scoring_prompt,
                    new_value: config.scoring_prompt
                });
            }

            if (changes.length > 0) {
                await supabase.from("ai_config_history").insert(changes);
            }

            setSaveStatus("success");
            setOriginalConfig({ ...config });
            fetchHistory();

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
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <RiLoader4Line className="text-4xl animate-spin mb-4 text-blue-500" />
                <p>Loading AI configurations...</p>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="p-8 text-center bg-white m-8 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-red-500 mb-4 font-medium">No AI configuration found in database.</p>
                <button
                    onClick={fetchConfig}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl transition-all"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    return (
        <div className="pb-12">
            <DashboardHeader title="AI Configuration Settings" />

            <main className="p-8 max-w-5xl mx-auto space-y-10">
                {/* AI Configuration Form Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">AI Prompt Setup</h2>
                            <p className="text-sm text-gray-500">Master instructions that control how Gemini parses and scores CVs.</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || JSON.stringify(config) === JSON.stringify(originalConfig)}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:shadow-none ${saveStatus === "success"
                                ? "bg-green-600 text-white shadow-green-500/20"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                                }`}
                        >
                            {isSaving ? (
                                <RiLoader4Line className="animate-spin text-xl" />
                            ) : saveStatus === "success" ? (
                                <RiCheckLine className="text-xl" />
                            ) : null}
                            {isSaving ? "Saving..." : saveStatus === "success" ? "Saved!" : "Save Changes"}
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl p-8 space-y-8 shadow-sm">
                        <PromptEditor
                            label="Persona Prompt"
                            value={config.persona_prompt}
                            onChange={(val) => setConfig({ ...config, persona_prompt: val })}
                            rows={3}
                        />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                            <PromptEditor
                                label="Extraction Prompt"
                                value={config.extraction_prompt}
                                onChange={(val) => setConfig({ ...config, extraction_prompt: val })}
                                rows={12}
                            />
                            <PromptEditor
                                label="Scoring Prompt"
                                value={config.scoring_prompt}
                                onChange={(val) => setConfig({ ...config, scoring_prompt: val })}
                                rows={12}
                            />
                        </div>
                    </div>
                </section>

                {/* Change History Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <RiHistoryLine className="text-xl text-gray-400" />
                        <h2 className="text-xl font-bold text-gray-900">Change History</h2>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                        {history.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {history.map((item) => (
                                    <div key={item.id} className="px-8 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${item.prompt_type === 'persona' ? 'bg-purple-500' :
                                                item.prompt_type === 'extraction' ? 'bg-blue-500' : 'bg-amber-500'
                                                }`} />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    <span className="capitalize">{item.prompt_type}</span> prompt updated
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(item.changed_at).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Optional: Add a "View diff" button here later */}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-8 py-12 text-center text-gray-400 italic">
                                No changes recorded yet.
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
