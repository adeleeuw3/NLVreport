"use client";

import React, { useState, useEffect } from "react";
import { StorageService, DashboardDocument } from "@/lib/storage-service";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2, Eye, Plus, CheckCircle, Circle, Play, History } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import { NetworkBackground } from "@/components/NetworkBackground";

interface KPIDataHubProps {
    uid: string;
    onSelectMonth: (month: string, year: string) => void;
    onCreateStory: () => void;
    onLoadDashboard: (formData: any, title: string) => void;
}

export function KPIDataHub({ uid, onSelectMonth, onCreateStory, onLoadDashboard }: KPIDataHubProps) {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [savedMonths, setSavedMonths] = useState<string[]>([]);
    const [dashboards, setDashboards] = useState<DashboardDocument[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingDashboards, setLoadingDashboards] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { addToast } = useToast();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        loadMonthStatus();
    }, [uid, year]);

    useEffect(() => {
        loadDashboards();
    }, [uid]);

    const loadMonthStatus = async () => {
        setLoadingData(true);
        const saved = await StorageService.getSavedMonths(uid, year);
        setSavedMonths(saved);
        setLoadingData(false);
    };

    const loadDashboards = async () => {
        setLoadingDashboards(true);
        const data = await StorageService.getDashboards(uid);
        setDashboards(data);
        setLoadingDashboards(false);
    };

    const handleDeleteDashboard = async (dashboardId: string) => {
        if (deleteConfirm !== dashboardId) {
            setDeleteConfirm(dashboardId);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        const result = await StorageService.deleteDashboard(uid, dashboardId);
        if (result.success) {
            addToast("Snapshot deleted successfully", "success");
            loadDashboards();
        } else {
            addToast("Failed to delete snapshot", "error");
        }
        setDeleteConfirm(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 relative">
            {/* Background Visualization */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[100vh] fixed -z-0 pointer-events-none">
                <div className="w-full h-full relative opacity-100">
                    <NetworkBackground />
                </div>
            </div>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2 drop-shadow-sm">KPI Data Hub</h1>
                    <p className="text-slate-600 font-medium text-lg">Manage monthly data and generate story dashboards.</p>
                </div>

                <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</span>
                    <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="bg-transparent border-none text-2xl font-black text-slate-800 focus:ring-0 cursor-pointer outline-none"
                    >
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* MAIN ACTION AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">

                {/* MONTH GRID (Left - 8 cols) */}
                <div className="lg:col-span-12 xl:col-span-8">
                    <div className="bg-white/95 backdrop-blur-md shadow-xl border border-white/60 rounded-3xl p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Monthly Data</h2>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-white/60">
                                {savedMonths.length} / 12 Complete
                            </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                            {months.map(m => {
                                const isSaved = savedMonths.includes(m);
                                return (
                                    <button
                                        key={m}
                                        onClick={() => onSelectMonth(m, year)}
                                        className={`
                                            group relative flex flex-col items-center justify-center aspect-square rounded-2xl border transition-all duration-300
                                            ${isSaved
                                                ? "bg-white border-orange-200 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20"
                                                : "bg-white/80 border-white/60 hover:bg-white hover:border-white/80 shadow-sm"
                                            }
                                        `}
                                    >
                                        <span className={`text-lg font-bold mb-2 ${isSaved ? "text-[var(--primary)]" : "text-slate-400 group-hover:text-slate-600"}`}>{m}</span>
                                        {isSaved ? (
                                            <CheckCircle size={24} className="text-[var(--primary)] fill-orange-100" />
                                        ) : (
                                            <Circle size={24} className="text-slate-300 group-hover:text-slate-400" />
                                        )}

                                        {!isSaved && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-2xl backdrop-blur-sm">
                                                <span className="text-xs font-bold text-[var(--primary)] flex items-center"><Plus size={14} className="mr-1" /> Add</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* GENERATE CARD (Right - 4 cols) */}
                <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 border-none shadow-glass liquid-gradient text-white overflow-hidden relative group rounded-3xl flex flex-col">
                        {/* Decorative blobs inside card */}
                        <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-[-20%] left-[-20%] w-48 h-48 bg-orange-300/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 delay-100" />

                        <div className="flex flex-col justify-center h-full p-8 relative z-10">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black tracking-tight mb-2">Create or Update Story</h2>
                                <p className="text-white/90 font-medium text-lg leading-relaxed">Generate a fresh story from your available monthly data.</p>
                            </div>
                            <Button
                                onClick={onCreateStory}
                                size="lg"
                                className="w-full bg-white text-[var(--primary)] hover:bg-orange-50 font-bold h-14 text-lg shadow-xl shadow-black/10 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Play size={24} className="mr-2 fill-current" /> Open Story Builder
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SNAPSHOTS LIBRARY */}
            <div className="pt-10">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <History size={32} className="text-[var(--primary)]" />
                    Saved Snapshots
                </h2>

                {dashboards.length === 0 ? (
                    <div className="text-center py-16 glass-panel rounded-3xl border-dashed border-slate-300">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--primary)]">
                            <Play size={32} className="ml-1" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">No stories yet</h3>
                        <p className="text-slate-500 font-medium">Generate your first dashboard above to save a snapshot.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {dashboards.map((dashboard) => (
                            <div
                                key={dashboard.id}
                                className="bg-white/95 border border-white/60 shadow-lg group relative rounded-2xl overflow-hidden flex flex-col h-full min-h-[220px] backdrop-blur-md"
                            >
                                <div className="h-2 w-full liquid-gradient opacity-80" />

                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">{dashboard.title || "Untitled Snapshot"}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-4">
                                        Based on saved data · Uses live inputs
                                    </p>

                                    <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white shadow-sm"
                                                onClick={() => onLoadDashboard(dashboard.formData, dashboard.title)}
                                            >
                                                <Eye size={14} className="mr-2" /> Open
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                                onClick={() => onLoadDashboard(dashboard.formData, dashboard.title)}
                                            >
                                                <History size={14} className="mr-2" /> Regenerate
                                            </Button>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(dashboard.updatedAt)}</span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={() => handleDeleteDashboard(dashboard.id)}
                                            >
                                                {deleteConfirm === dashboard.id ? "Sure?" : <Trash2 size={14} />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
