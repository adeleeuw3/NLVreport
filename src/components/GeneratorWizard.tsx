"use client";

import React, { useState, useEffect } from "react";
import { KPIDefinition, KPI_LIST } from "@/lib/kpi-definitions";
import { KPICard } from "@/components/KPICard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ChevronRight, Play, RefreshCw, Save } from "lucide-react";

export function GeneratorWizard() {
    const [selectedCategory, setSelectedCategory] = useState<string>("General");
    const [selectedKPI, setSelectedKPI] = useState<KPIDefinition>(KPI_LIST[0]);
    const [formData, setFormData] = useState<any>({});
    const [previewData, setPreviewData] = useState<any[]>([]);

    const categories = Array.from(new Set(KPI_LIST.map(k => k.category)));
    const currentKPIs = KPI_LIST.filter(k => k.category === selectedCategory);

    useEffect(() => {
        setFormData({});
        generatePreview({}, selectedKPI);
    }, [selectedKPI]);

    const handleInputChange = (id: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const generatePreview = (data: any = formData, kpi: KPIDefinition = selectedKPI) => {
        let chartData: any[] = [];
        try {
            if (["AreaChart", "BarChart", "Sparkline"].includes(kpi.visualization)) {
                const labels = (data.months || data.labels || "Jan,Feb,Mar,Apr,May").split(",");
                const values = (data.values || data.current || "10,20,15,30,25").toString().split(",").map(Number);
                chartData = labels.map((label: string, i: number) => ({ name: label.trim(), value: values[i] || 0 }));
            }
            else if (kpi.visualization === "Donut") {
                chartData = [
                    { name: "Wins", value: Number(data.wins || 10) },
                    { name: "Losses", value: Number(data.losses || 5) }
                ];
            }
            else if (kpi.visualization === "Radar") {
                chartData = [
                    { name: "Design", value: Number(data.design || 80) },
                    { name: "Support", value: Number(data.support || 60) },
                    { name: "Data", value: Number(data.data || 40) },
                    { name: "Perform", value: Number(data.perform || 70) },
                ];
            }
            else if (kpi.visualization === "Leaderboard") {
                const raw = data.customers || "Client A: 500, Client B: 400";
                chartData = raw.split(",").map((entry: string) => {
                    const [name, val] = entry.split(":");
                    return { name: name?.trim(), value: Number(val?.trim() || 0) };
                });
            }
            else if (kpi.visualization === "GroupedBar") {
                chartData = [
                    { name: "MOOCs", value: Number(data.mooc_c || 5), value2: Number(data.mooc_p || 100) },
                    { name: "Webinars", value: Number(data.web_c || 2), value2: Number(data.web_p || 250) },
                ];
            }
            else if (kpi.visualization === "Gauge") {
                chartData = [{ name: "Score", value: Number(data.score || 75) }];
            }
            setPreviewData(chartData);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
            <Card className="w-full lg:w-1/3 p-6 glass-card bg-white/60">
                <h2 className="text-xl font-bold mb-4 text-slate-800">KPI Generator</h2>
                <Tabs defaultValue={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
                    <TabsList className="w-full grid grid-cols-3 h-auto gap-1">
                        {categories.slice(0, 6).map(cat => (
                            <TabsTrigger key={cat} value={cat} className="text-xs">{cat}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="mb-6">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Select KPI</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2">
                        {currentKPIs.map(kpi => (
                            <button
                                key={kpi.id}
                                onClick={() => setSelectedKPI(kpi)}
                                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all border ${selectedKPI.id === kpi.id
                                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md"
                                        : "bg-white/50 text-slate-600 border-white/50 hover:bg-white"
                                    }`}
                            >
                                <span>{kpi.title}</span>
                                {selectedKPI.id === kpi.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 mb-6">
                    <label className="text-xs font-semibold text-slate-500 uppercase block">Input Data</label>
                    {selectedKPI.inputs.map(input => (
                        <div key={input.id}>
                            <label className="text-xs text-slate-700 font-medium mb-1 block">{input.label}</label>
                            <Input
                                placeholder={input.placeholder}
                                onChange={(e) => handleInputChange(input.id, e.target.value)}
                                className="bg-white/70"
                            />
                        </div>
                    ))}
                </div>

                <Button onClick={() => generatePreview()} className="w-full" size="lg">
                    <Play size={16} className="mr-2" /> Generate Visualization
                </Button>
            </Card>

            <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Preview</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => generatePreview()}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
                        <Button variant="secondary" size="sm"><Save size={14} className="mr-1" /> Save</Button>
                    </div>
                </div>

                <div className="flex-1 p-8 rounded-2xl border border-white/50 bg-gradient-to-br from-white/30 to-white/10 shadow-2xl backdrop-blur-3xl flex items-center justify-center">
                    <div className="w-full max-w-2xl h-[400px]">
                        <KPICard definition={selectedKPI} data={previewData} title={selectedKPI.title} />
                    </div>
                </div>
            </div>
        </div>
    );
}
