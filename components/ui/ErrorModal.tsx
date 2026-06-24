"use client";

import { useEffect, useState } from "react";
import { RiErrorWarningLine, RiCloseLine } from "react-icons/ri";

interface ErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
}

export default function ErrorModal({
    isOpen,
    onClose,
    title = "Terjadi Kesalahan",
    message,
}: ErrorModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                }`}
            onClick={onClose}
        >
            <div
                className={`w-full max-w-sm bg-[#161616] border border-[#2d2d2d] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
                    }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="pt-8 pb-4 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                        <RiErrorWarningLine className="w-8 h-8 text-red-500" />
                    </div>
                    <div className="text-center px-6">
                        <h3 className="text-lg font-bold text-white tracking-tight">
                            {title}
                        </h3>
                        <p className="mt-2 text-sm text-zinc-400 font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Footer / Action */}
                <div className="p-4 bg-[#1c1c1c]/50 border-t border-[#2d2d2d] mt-2">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-sm font-bold rounded-xl transition-all active:scale-[0.98]"
                    >
                        Tutup
                    </button>
                </div>

                {/* Close X Button (Optional) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-zinc-600 hover:text-white transition-colors"
                >
                    <RiCloseLine size={24} />
                </button>
            </div>
        </div>
    );
}
