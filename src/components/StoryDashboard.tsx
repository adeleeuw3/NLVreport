"use client";

import React from "react";
import { KPICard } from "@/components/KPICard";
import { KPI_LIST } from "@/lib/kpi-definitions";
import { compareData } from "@/lib/comparison-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Download, Save } from "lucide-react";
import { StorageService } from "@/lib/storage-service";
import { useToast } from "@/components/ui/toast-context";
import { useState } from "react";

interface StoryDashboardProps {
    formData: any;
    previousData?: any | null;
    onBack: () => void;
    onSave?: (title: string) => void;
    uid?: string;
    initialTitle?: string;
}

export function StoryDashboard({ formData, previousData, onBack, onSave, uid, initialTitle = "" }: StoryDashboardProps) {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [dashboardTitle, setDashboardTitle] = useState(initialTitle);
    const { addToast } = useToast();

    const handleSaveDashboard = async () => {
        if (!uid) {
            addToast("User not authenticated", "error");
            return;
        }

        if (!dashboardTitle.trim()) {
            addToast("Please enter a title", "warning");
            return;
        }

        const result = await StorageService.saveDashboard(uid, dashboardTitle, formData);
        if (result.success) {
            addToast("Dashboard saved successfully!", "success");
            setShowSaveDialog(false);
            if (onSave) onSave(dashboardTitle);
        } else {
            addToast("Failed to save dashboard", "error");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Expose chart extraction for the utility - Wrap getChartData to solve scoping
    const extractChartDataHelp = (id: string, source: any) => getChartData(id, source === previousData);

    const getComparison = (kpiId: string) => {
        if (!previousData || !formData) return null;

        // The comparison-utils.ts expects (data: any) => number
        // We need to extract a single representative value for the KPI data object
        const extractValue = (kpiData: any) => {
            if (!kpiData) return 0;
            // If it has a 'value' field (simple KPIs)
            if (kpiData.value !== undefined) return Number(kpiData.value);
            // If it has 'data' string with comma separated values, take the last non-empty one
            if (kpiData.data) {
                const vals = kpiData.data.split(",").filter((s: string) => s.trim() !== "");
                return vals.length > 0 ? Number(vals[vals.length - 1]) : 0;
            }
            // Fallback: check standard fields
            return Number(kpiData.wins || kpiData.nl || kpiData.in || kpiData.mooc_c || 0);
        };

        return compareData(kpiId, formData, previousData, extractValue);
    };

    const getChartData = (kpiId: string, isGhost: boolean = false) => {
        const sourceData = isGhost ? previousData : formData;
        if (isGhost && !sourceData) return [];

        const kpi = KPI_LIST.find(k => k.id === kpiId);
        if (!kpi) return [];

        const data = sourceData[kpiId] || {};
        let chartData: any[] = [];

        try {
            if (kpiId === "mkt_linkedin_combined") {
                // LinkedIn Dual Line
                const posts = (data.posts || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));
                const engage = (data.engage || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));
                const len = Math.max(posts.length, engage.length);
                if (len === 0 && !isGhost) return [];

                chartData = Array.from({ length: len }).map((_, i) => ({
                    name: i + 1,
                    value: posts[i] || 0,   // Line 1
                    value2: engage[i] || 0  // Line 2
                }));
            }
            else if (["AreaChart", "BarChart", "LineChart"].includes(kpi.visualization)) {
                // Fix: Use 12 months and don't filter out empty values (prevents shifting)
                const labels = (data.months || data.labels || "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec").split(",");
                // REMOVED HARDCODED FALLBACK
                const values = (data.data || data.values || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));

                // If completely empty and ghost, return empty to hide ghost line
                if (values.every((v: number) => v === 0) && isGhost) return [];

                chartData = labels.map((label: string, i: number) => ({ name: label.trim(), value: values[i] || 0 }));
            }
            else if (kpi.visualization === "Sparkline") {
                // REMOVED HARDCODED FALLBACK
                const hist = (data.trend || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));
                if (hist.every((v: number) => v === 0) && isGhost) return [];
                chartData = hist.map((val: number, i: number) => ({ name: i, value: val }));
            }
            else if (kpi.visualization === "Donut" || kpi.visualization === "Map") {
                // For Map/Donut/Pie, simple mapping
                if (data.wins) chartData.push({ name: "Wins", value: Number(data.wins) });
                if (data.losses) chartData.push({ name: "Losses", value: Number(data.losses) });
                if (data.nl) chartData.push({ name: "NL", value: Number(data.nl) });
                if (data.be) chartData.push({ name: "BE", value: Number(data.be) });
                if (data.de) chartData.push({ name: "DE", value: Number(data.de) });
                if (data.in) chartData.push({ name: "Within SLA", value: Number(data.in) });
                if (data.out) chartData.push({ name: "Outside SLA", value: Number(data.out) });

                // If empty
                if (chartData.length === 0 && !isGhost) return [];
            }
            else if (kpi.visualization === "GroupedBar") {
                if (kpiId === "comm_engagement") {
                    // If data missing, don't return defaults for ghost
                    if (isGhost && !data.mooc_c) return [];

                    chartData = [
                        { name: "MOOCs", value: Number(data.mooc_c || 0), value2: Number(data.mooc_p || 0) },
                        { name: "Webinars", value: Number(data.web_c || 0), value2: Number(data.web_p || 0) },
                        { name: "Comm.", value: Number(data.com_c || 0), value2: Number(data.com_p || 0) },
                        { name: "Lectures", value: Number(data.guest_c || 0), value2: Number(data.guest_p || 0) },
                    ];
                } else {
                    const events = Number(data.events || data.upsell || 0);
                    const people = Number(data.people || data.resell || 0);
                    chartData = [{ name: "Total", value: events, value2: people }];
                }
            }
            else if (kpi.visualization === "Leaderboard") {
                const raw = data.data || "";
                chartData = raw.split(",").map((entry: string) => {
                    const [name, val] = entry.split(":");
                    return { name: name?.trim(), value: name ? Number(val?.trim() || 0) : 0 };
                }).filter((x: any) => x.name);
            }
            else if (kpi.visualization === "Radar") {
                chartData = [
                    { name: "Design", value: Number(data.design || 0) },
                    { name: "Support", value: Number(data.support || 0) },
                    { name: "Data", value: Number(data.data || 0) },
                    { name: "Perform", value: Number(data.perform || 0) },
                ];
            }
            else if (["Gauge", "Progress"].includes(kpi.visualization)) {
                chartData = [{ name: "Score", value: Number(data.score || data.progress || 0) }];
            }
            else if (kpi.visualization === "Counter") {
                chartData = [{ name: "Value", value: data.count || data.winner || 0 }];
            }
            else if (kpi.visualization === "Kanban") {
                chartData = [
                    { name: "Start", value: Number(data.start || 0) },
                    { name: "In Progress", value: Number(data.in_progress || 0) },
                    { name: "Done", value: Number(data.done || 0) },
                ];
            }
        } catch (e) { console.warn(e); }

        return chartData;
    };

    const headlines = ["gen_csat", "gen_revenue", "sales_rfi", "mkt_coffee"];
    const trends = ["gen_customers", "sales_geo", "comm_demos", "help_tickets"];

    // Explicit category order
    const categories = ["General", "Sales", "Community", "Marketing", "People", "Helpdesk", "Production"];

    return (
        <div className="w-full pb-20 animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-8">
                <Button variant="ghost" onClick={onBack} className="text-slate-500 hover:text-slate-800">
                    <ChevronLeft className="mr-2" size={16} /> Back to Library
                </Button>
                <div className="flex gap-2">
                    {uid && (
                        <Button
                            onClick={() => setShowSaveDialog(true)}
                            className="bg-[var(--primary)] hover:bg-[var(--secondary)] text-white shadow-md"
                        >
                            <Save className="mr-2" size={16} /> Save Dashboard
                        </Button>
                    )}
                    <Button onClick={handlePrint} variant="outline" className="glass-card bg-white shadow-sm hover:bg-slate-50">
                        <Download className="mr-2" size={16} /> Print / Export PDF
                    </Button>
                </div>
            </div>

            {/* SAVE DASHBOARD DIALOG */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="glass-card">
                    <DialogHeader>
                        <DialogTitle>Save Dashboard</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={dashboardTitle}
                            onChange={(e) => setDashboardTitle(e.target.value)}
                            placeholder="Enter dashboard title (e.g., Q1 2025 Report)"
                            className="w-full"
                            onKeyDown={(e) => e.key === "Enter" && handleSaveDashboard()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveDashboard} className="bg-[var(--primary)] hover:bg-[var(--secondary)] text-white">
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* HEADER IMAGE */}
            <div className="w-full flex justify-center mb-8 px-4">
                <img
                    src="/nlv-header.png"
                    alt="NLV 2026 Objectives: International, National, HPA, Tech, Culture, Process"
                    className="w-full max-w-6xl rounded-xl shadow-sm border border-slate-100"
                />
            </div>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">Performance Story</h1>
                <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
            </div>

            <Tabs defaultValue="Overview" className="w-full">
                <div className="flex justify-center mb-8 overflow-x-auto pb-2">
                    <TabsList className="bg-white/80 p-1 border border-slate-200 shadow-sm rounded-full inline-flex">
                        <TabsTrigger value="Overview" className="rounded-full px-4 data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">Overview</TabsTrigger>
                        {categories.map(cat => (
                            <TabsTrigger key={cat} value={cat} className="rounded-full px-4 data-[state=active]:bg-slate-800 data-[state=active]:text-white">{cat}</TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* OVERVIEW TAB: The Storytelling View */}
                <TabsContent value="Overview" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Headlines */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {headlines.map(id => {
                            const kpi = KPI_LIST.find(k => k.id === id);
                            if (!kpi) return null;
                            return <div key={id} className="h-[180px]"><KPICard definition={kpi} data={getChartData(id)} title={kpi.title} /></div>;
                        })}
                    </div>

                    {/* Trends */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {trends.map(id => {
                            const kpi = KPI_LIST.find(k => k.id === id);
                            if (!kpi) return null;
                            return <div key={id} className="h-[320px]"><KPICard definition={kpi} data={getChartData(id)} title={kpi.title} /></div>;
                        })}
                    </div>
                </TabsContent>

                {/* CATEGORY TABS: Detailed Breakdown */}
                {categories.map(category => (
                    <TabsContent key={category} value={category} className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {KPI_LIST.filter(k => k.category === category).map(kpi => (
                                <div key={kpi.id} className="h-[300px]">
                                    <KPICard definition={kpi} data={getChartData(kpi.id)} title={kpi.title} />
                                </div>
                            ))}
                            {KPI_LIST.filter(k => k.category === category).length === 0 && (
                                <p className="col-span-3 text-center text-slate-400 py-10">No KPIs found for this category.</p>
                            )}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
