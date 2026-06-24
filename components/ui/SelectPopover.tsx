"use client";

import { useState, useRef, useEffect } from "react";
import { RiArrowDownSLine, RiCheckLine } from "react-icons/ri";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Option {
    id: string;
    label: string;
}

interface SelectPopoverProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export default function SelectPopover({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    label,
    className,
}: SelectPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.id === value || opt.label === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider ml-1 mb-2">
                    {label}
                </label>
            )
            }
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-[#0F0F0E] border border-tm-border rounded-[10px] px-6 py-4 text-sm flex items-center justify-between cursor-pointer transition-all hover:border-white/30",
                    isOpen && "ring-1 ring-white/70 border-white/50"
                )}
            >
                <span className={cn(selectedOption ? "text-white" : "text-white/50")}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <RiArrowDownSLine
                    className={cn(
                        "text-xl text-white/50 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full top-full left-0 mt-2 bg-[#1F1F1F] border border-tm-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-60 overflow-y-auto scrollbar-thin py-1">
                        {options.length === 0 ? (
                            <div className="px-6 py-4 text-sm text-white/30 text-center">
                                No options available
                            </div>
                        ) : (
                            options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => {
                                        onChange(option.id);
                                        setIsOpen(false);
                                    }}
                                    className="px-6 py-3 text-sm text-white/80 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors group"
                                >
                                    <span className={cn(
                                        "transition-colors",
                                        (value === option.id || value === option.label) && "text-white font-semibold"
                                    )}>
                                        {option.label}
                                    </span>
                                    {(value === option.id || value === option.label) && (
                                        <RiCheckLine className="text-white text-lg" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
