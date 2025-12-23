"use client";

import React, { useState, useEffect } from "react";
import { StorageService, DashboardDocument } from "@/lib/storage-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Trash2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

interface DashboardLibraryProps {
    uid: string;
    onLoadDashboard: (formData: any, title: string) => void;
    onCreateNew: () => void;
}

export function DashboardLibrary({ uid, onLoadDashboard, onCreateNew }: DashboardLibraryProps) {
    const [dashboards, setDashboards] = useState<DashboardDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        loadDashboards();
    }, [uid]);

    const loadDashboards = async () => {
        setLoading(true);
        const data = await StorageService.getDashboards(uid);
        setDashboards(data);
        setLoading(false);
    };

    const handleDelete = async (dashboardId: string) => {
        if (deleteConfirm !== dashboardId) {
            setDeleteConfirm(dashboardId);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        const result = await StorageService.deleteDashboard(uid, dashboardId);
        if (result.success) {
            addToast("Dashboard deleted successfully", "success");
            loadDashboards();
        } else {
            addToast("Failed to delete dashboard", "error");
        }
        setDeleteConfirm(null);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-slate-400 text-lg font-medium">Loading dashboards...</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Dashboard Library</h1>
                <p className="text-slate-500 text-sm">Browse and manage your saved dashboards</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CREATE NEW CARD */}
                <Card
                    onClick={onCreateNew}
                    className="h-[240px] flex flex-col items-center justify-center glass-card border-2 border-dashed border-[var(--primary)]/30 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all duration-300 cursor-pointer group"
                >
                    <Plus size={48} className="text-[var(--primary)] mb-4 group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-bold text-slate-700 group-hover:text-[var(--primary)] transition-colors">Create New Dashboard</span>
                </Card>

                {/* DASHBOARD CARDS */}
                {dashboards.map((dashboard) => (
                    <Card
                        key={dashboard.id}
                        className="h-[240px] flex flex-col glass-card border-none shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group bg-white"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />

                        <CardHeader className="pb-3 pt-5 px-5">
                            <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2 min-h-[56px]">
                                {dashboard.title || "Untitled Dashboard"}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                                <Calendar size={12} />
                                <span>{formatDate(dashboard.updatedAt)}</span>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-end p-5 pt-0">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onLoadDashboard(dashboard.formData, dashboard.title)}
                                    className="flex-1 bg-[var(--primary)] hover:bg-[var(--secondary)] text-white font-bold"
                                    size="sm"
                                >
                                    <Eye size={14} className="mr-2" />
                                    View
                                </Button>
                                <Button
                                    onClick={() => handleDelete(dashboard.id)}
                                    variant={deleteConfirm === dashboard.id ? "destructive" : "outline"}
                                    className={`${deleteConfirm === dashboard.id ? "bg-red-600 hover:bg-red-700 text-white" : "border-slate-200 hover:bg-red-50 hover:text-red-500"}`}
                                    size="sm"
                                >
                                    {deleteConfirm === dashboard.id ? (
                                        <span className="text-xs font-bold">Sure?</span>
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {dashboards.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-slate-400 text-lg font-medium">No dashboards saved yet</p>
                    <p className="text-slate-300 text-sm mt-2">Create your first dashboard to get started!</p>
                </div>
            )}
        </div>
    );
}
