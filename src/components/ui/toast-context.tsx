"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, type: ToastType) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* TOAST CONTAINER FIXED */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md animate-in slide-in-from-right-full duration-300
                            ${toast.type === "success" ? "bg-emerald-50/90 border-emerald-100 text-emerald-800" : ""}
                            ${toast.type === "error" ? "bg-rose-50/90 border-rose-100 text-rose-800" : ""}
                            ${toast.type === "warning" ? "bg-amber-50/90 border-amber-100 text-amber-800" : ""}
                            ${toast.type === "info" ? "bg-blue-50/90 border-blue-100 text-blue-800" : ""}
                        `}
                    >
                        <div className="mt-0.5">
                            {toast.type === "success" && <CheckCircle size={18} className="text-emerald-500" />}
                            {toast.type === "error" && <AlertOctagon size={18} className="text-rose-500" />}
                            {toast.type === "warning" && <AlertTriangle size={18} className="text-amber-500" />}
                            {toast.type === "info" && <Info size={18} className="text-blue-500" />}
                        </div>
                        <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
