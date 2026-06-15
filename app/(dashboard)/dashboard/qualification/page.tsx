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
            <main className="p-8">
                <div className="flex justify-end mb-8">
                    <button
                        onClick={handleAdd}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        + Add Position
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-500">Loading positions...</div>
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
                        <div className="col-span-full py-20 text-center text-gray-500">No positions found. Add one to get started.</div>
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
