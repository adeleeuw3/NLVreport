"use client";

import React from "react";
import { KPICard } from "@/components/KPICard";
import { KPI_LIST } from "@/lib/kpi-definitions";
import { compareData } from "@/lib/comparison-utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Download, Save, Calendar, Edit, History as HistoryIcon } from "lucide-react";
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
    onEditScope: () => void;
}

export function StoryDashboard({ formData, previousData, onBack, onSave, uid, initialTitle = "", onEditScope }: StoryDashboardProps) {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [dashboardTitle, setDashboardTitle] = useState(initialTitle);
    const { addToast } = useToast();

    // metadata from stitcher
    const meta = formData._meta || {};
    const rangeLabel = meta.rangeLabel || "Custom Range";
    const showMoM = meta.showMoM !== false; // Default true

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
            addToast("Snapshot saved to Library!", "success");
            setShowSaveDialog(false);
            if (onSave) onSave(dashboardTitle);
        } else {
            addToast("Failed to save snapshot", "error");
        }
    };

    const handlePrint = () => {
        window.print();
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
                // Standard Charts
                const labels = (data.months || data.labels || "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec").split(",");
                // If the data came from stitcher, it might not have 'months' key in the kpi object, 
                // but the MAIN object has _meta.months.
                const metaMonths = meta.months || [];

                const values = (data.data || data.values || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));

                // Match labels to values length if using customized range
                if (metaMonths.length > 0) {
                    chartData = metaMonths.map((label: string, i: number) => ({ name: label, value: values[i] || 0 }));
                    // If values checks
                } else {
                    chartData = labels.slice(0, values.length).map((label: string, i: number) => ({ name: label.trim(), value: values[i] || 0 }));
                }

                // If completely empty and ghost, return empty to hide ghost line
                if (values.every((v: number) => v === 0) && isGhost) return [];
            }
            else if (kpi.visualization === "Sparkline") {
                const hist = (data.trend || "").split(",").map((x: string) => x.trim() === "" ? 0 : Number(x));
                if (hist.every((v: number) => v === 0) && isGhost) return [];
                chartData = hist.map((val: number, i: number) => ({ name: i, value: val }));
            }
            else if (kpi.visualization === "Donut" || kpi.visualization === "Map") {
                if (data.wins) chartData.push({ name: "Wins", value: Number(data.wins) });
                if (data.losses) chartData.push({ name: "Losses", value: Number(data.losses) });
                if (data.nl) chartData.push({ name: "NL", value: Number(data.nl) });
                if (data.be) chartData.push({ name: "BE", value: Number(data.be) });
                if (data.de) chartData.push({ name: "DE", value: Number(data.de) });
                if (data.in) chartData.push({ name: "Within SLA", value: Number(data.in) });
                if (data.out) chartData.push({ name: "Outside SLA", value: Number(data.out) });
                if (chartData.length === 0 && !isGhost) return [];
            }
            else if (kpi.visualization === "GroupedBar") {
                if (kpiId === "comm_engagement") {
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
                if (kpiId === "sales_geo") {
                    chartData = [
                        { name: "NL", value: Number(data.nl || 0) },
                        { name: "BE", value: Number(data.be || 0) },
                        { name: "DE", value: Number(data.de || 0) },
                    ];
                } else {
                    chartData = [
                        { name: "Design", value: Number(data.design || 0) },
                        { name: "Support", value: Number(data.support || 0) },
                        { name: "Data", value: Number(data.data || 0) },
                        { name: "Perform", value: Number(data.perform || 0) },
                    ];
                }
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
    const categories = ["General", "Sales", "Community", "Marketing", "People", "Helpdesk", "Production"];

    return (
        <div className="w-full pb-32 animate-in fade-in duration-700">

            {/* TOP BAR / SCOPE INDICATOR */}
            <div className="glass-panel p-3 mb-8 sticky top-4 z-30 mx-4 md:mx-8 rounded-2xl shadow-xl flex justify-between items-center transition-all hover:shadow-2xl hover:bg-white/80">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-500 hover:text-[var(--primary)] hover:bg-orange-50 -ml-1 rounded-xl">
                        <ChevronLeft size={18} className="mr-1" /> Library
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 text-slate-700 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                        <Calendar size={16} className="text-[var(--primary)]" />
                        <span className="font-bold text-sm tracking-wide">{rangeLabel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {uid && (
                        <Button
                            size="sm"
                            onClick={() => setShowSaveDialog(true)}
                            className="liquid-gradient text-white border-none h-9 px-4 text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-orange-500/20"
                        >
                            <Save className="mr-2" size={14} /> Save Snapshot
                        </Button>
                    )}
                </div>
            </div>

            {/* MAIN DASHBOARD CONTENT */}
            {/* MAIN DASHBOARD CONTENT */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                <Tabs defaultValue="Overview" className="w-full">
                    {/* TOP NAVIGATION BAR */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <TabsList className="bg-white/80 p-1.5 rounded-full inline-flex border border-slate-200 backdrop-blur-sm shadow-sm">
                            <TabsTrigger value="Overview" className="rounded-full px-5 py-2 text-sm font-bold data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-slate-500">Overview</TabsTrigger>
                            <div className="w-px h-4 bg-slate-300 mx-1 self-center" />
                            {categories.map(cat => (
                                <TabsTrigger key={cat} value={cat} className="rounded-full px-4 py-2 text-sm font-bold data-[state=active]:bg-slate-800 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-slate-500 hover:text-slate-800">{cat}</TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 bg-white/50 border border-white/60 shadow-sm">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Period</span>
                                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={14} className="text-[var(--primary)]" /> {rangeLabel}
                                </span>
                            </div>
                            <div className="h-8 w-px bg-slate-200 mx-2" />
                            <Button variant="ghost" size="sm" onClick={onEditScope} className="h-8 text-slate-500 hover:text-[var(--primary)] hover:bg-orange-50 font-bold">
                                <HistoryIcon size={14} className="mr-2" /> Adjust Data
                            </Button>
                        </div>
                    </div>

                    {/* TAB CONTENT: EXECUTIVE OVERVIEW */}
                    <TabsContent value="Overview" className="animate-in fade-in duration-500 space-y-10">
                        {/* Header */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">Executive Overview</h1>
                            <p className="text-slate-500 font-medium text-lg">Real-time insights for your business growth.</p>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {headlines.map(id => {
                                const kpi = KPI_LIST.find(k => k.id === id);
                                if (!kpi) return null;
                                return <div key={id} className="h-[160px]"><KPICard definition={kpi} data={getChartData(id)} title={kpi.title} /></div>;
                            })}
                        </div>

                        {/* Main Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 h-[400px]">
                                {trends[0] && (() => {
                                    const kpi = KPI_LIST.find(k => k.id === trends[0]);
                                    return kpi ? <KPICard definition={kpi} data={getChartData(kpi.id)} title="Revenue Trends" /> : null;
                                })()}
                            </div>
                            <div className="lg:col-span-1 h-[400px]">
                                {trends[2] && (() => {
                                    const kpi = KPI_LIST.find(k => k.id === trends[2]);
                                    return kpi ? <KPICard definition={kpi} data={getChartData(kpi.id)} title="Traffic Sources" /> : null;
                                })()}
                            </div>
                        </div>

                        {/* Secondary Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {trends.slice(1).map(id => {
                                if (id === trends[2]) return null;
                                const kpi = KPI_LIST.find(k => k.id === id);
                                if (!kpi) return null;
                                return <div key={id} className="h-[300px]"><KPICard definition={kpi} data={getChartData(id)} title={kpi.title} /></div>;
                            })}
                        </div>
                    </TabsContent>

                    {/* TAB CONTENT: CATEGORIES */}
                    {categories.map(category => (
                        <TabsContent key={category} value={category} className="animate-in fade-in duration-500">
                            <div className="mb-8">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">{category} Performance</h1>
                                <p className="text-slate-500 font-medium text-lg">Detailed analysis and metrics for {category.toLowerCase()}.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {KPI_LIST.filter(k => k.category === category).map(kpi => (
                                    <div key={kpi.id} className="h-[300px]">
                                        <KPICard definition={kpi} data={getChartData(kpi.id)} title={kpi.title} />
                                    </div>
                                ))}
                                {KPI_LIST.filter(k => k.category === category).length === 0 && (
                                    <div className="col-span-3 text-center py-20 bg-slate-50 rounded-2xl mx-auto w-full border border-dashed border-slate-200">
                                        <p className="font-bold text-slate-400 text-lg">No KPIs found for this category.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>


            {/* SAVE DASHBOARD DIALOG */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="glass-card border-none shadow-2xl bg-white/95">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800">Save Snapshot</DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block tracking-wider">Snapshot Title</label>
                        <Input
                            value={dashboardTitle}
                            onChange={(e) => setDashboardTitle(e.target.value)}
                            placeholder="e.g., Q1 2025 Review"
                            className="w-full font-bold text-xl glass-input h-14 rounded-xl"
                            onKeyDown={(e) => e.key === "Enter" && handleSaveDashboard()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowSaveDialog(false)} className="rounded-xl">Cancel</Button>
                        <Button onClick={handleSaveDashboard} className="liquid-gradient text-white rounded-xl font-bold px-6 shadow-lg">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
