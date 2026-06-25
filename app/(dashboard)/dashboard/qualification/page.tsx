"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";
import PositionCard from "@/components/qualification/PositionCard";
import PositionModal from "@/components/qualification/PositionModal";
import { createClient } from "@/lib/supabase/client";

export default function QualificationPage() {
    const [positions, setPositions] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    const fetchPositions = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("job_positions")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setPositions(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    const handleAdd = () => {
        setEditingPosition(null);
        setIsModalOpen(true);
    };

    const handleEdit = (position: any) => {
        setEditingPosition(position);
        setIsModalOpen(true);
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from("job_positions")
            .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (!error) {
            fetchPositions();
        }
    };

    const handleSave = async (data: any) => {
        const payload = {
            ...data,
            updated_at: new Date().toISOString(),
        };

        try {
            if (editingPosition) {
                const { error } = await supabase
                    .from("job_positions")
                    .update(payload)
                    .eq("id", editingPosition.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("job_positions")
                    .insert([payload]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchPositions();
        } catch (error: any) {
            console.error("Save error:", error);
            alert("Gagal menyimpan data: " + (error.message || "Unknown error"));
        }
    };

    return (
        <>
            <DashboardHeader title="Qualification Setup" />
            <main className="p-4 md:p-8 pb-12">
                <div className="flex justify-end mb-8">
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-md text-[14px] font-bold transition-all bg-white hover:bg-zinc-200 text-black shadow-xl cursor-pointer"
                    >
                        <span className="text-lg">+</span> Add Position
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-zinc-500">
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-zinc-800 rounded w-48 mx-auto"></div>
                                <div className="text-sm">Loading positions...</div>
                            </div>
                        </div>
                    ) : positions.length > 0 ? (
                        positions.map((pos) => (
                            <PositionCard
                                key={pos.id}
                                position={pos}
                                onEdit={() => handleEdit(pos)}
                                onToggleActive={() => handleToggleStatus(pos.id, pos.is_active)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                            <p className="text-zinc-500 mb-2">No positions found.</p>
                            <p className="text-xs text-zinc-600">Add one to get started.</p>
                        </div>
                    )}
                </div>

                <PositionModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    editTarget={editingPosition}
                />
            </main>
        </>
    );
}
