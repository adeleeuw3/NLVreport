"use client";

import React, { useState, useEffect } from "react";
import { KPI_LIST, KPICategory } from "@/lib/kpi-definitions";
import { useToast } from "@/components/ui/toast-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StorageService } from "@/lib/storage-service";
import { Save, Copy, RotateCcw, ArrowLeft, ArrowRight } from "lucide-react";

interface MonthlyDataEntryProps {
    uid: string;
    month: string;
    year: string;
    onBack: () => void;
}

export function MonthlyDataEntry({ uid, month, year, onBack }: MonthlyDataEntryProps) {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    // Derived for backward compatibility
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = months.indexOf(month);

    useEffect(() => {
        loadData();
    }, [uid, month, year]);

    const loadData = async () => {
        setLoading(true);
        try {
            const report = await StorageService.getReport(uid, month, year);
            if (report && report.data) {
                // CLEANUP / ADAPTER LOGIC
                const cleanData: any = {};

                Object.keys(report.data).forEach(kpiId => {
                    cleanData[kpiId] = {};
                    Object.keys(report.data[kpiId]).forEach(inputId => {
                        let val = report.data[kpiId][inputId];

                        // Legacy array handling
                        const kpiDef = KPI_LIST.find(k => k.id === kpiId);
                        const inputDef = kpiDef?.inputs.find(i => i.id === inputId);

                        if (inputDef?.type === "array" && typeof val === "string" && val.includes(",")) {
                            const arr = val.split(",").map(s => s.trim());
                            val = arr[monthIndex] || "";
                        }

                        cleanData[kpiId][inputId] = val;
                    });
                });

                setFormData(cleanData);
                addToast(`Loaded data for ${month} ${year}`, "info");
            } else {
                setFormData({});
            }
        } catch (e) {
            console.error(e);
            addToast("Error loading data", "error");
        }
        setLoading(false);
    };

    const handleCopyPrevious = async () => {
        try {
            const prevReport = await StorageService.getPreviousReport(uid, month, year);
            if (prevReport && prevReport.data) {
                setFormData(prevReport.data);
                addToast("Copied data from previous month", "success");
            } else {
                addToast("No previous data found", "warning");
            }
        } catch (e) {
            addToast("Error copying data", "error");
        }
    };

    const handleSave = async () => {
        try {
            await StorageService.saveReport(uid, month, year, formData);
            addToast(`Saved ${month} ${year}`, "success");
        } catch (e) {
            addToast("Failed to save", "error");
        }
    };

    const handleChange = (kpiId: string, inputId: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [kpiId]: {
                ...prev[kpiId],
                [inputId]: value
            }
        }));
    };

    const categories = Array.from(new Set(KPI_LIST.map(k => k.category))) as KPICategory[];

    return (
        <div className="w-full max-w-4xl mx-auto pb-32 pt-6 px-4">
            {/* HEADER */}
            <div className="glass-panel rounded-2xl p-4 flex items-center justify-between mb-8 sticky top-4 z-20 shadow-xl">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-slate-200">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none">{month} {year}</h1>
                        <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest mt-1">Data Entry</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopyPrevious} className="hidden md:flex text-slate-500 hover:text-[var(--primary)] hover:bg-orange-50">
                        <Copy size={16} className="mr-2" /> Copy Previous
                    </Button>
                    <Button onClick={handleSave} className="liquid-gradient text-white font-bold shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-105 active:scale-95">
                        <Save size={18} className="mr-2" /> Save Changes
                    </Button>
                </div>
            </div>

            {/* FORM */}
            <Accordion type="multiple" defaultValue={["General", "Sales"]} className="w-full space-y-6">
                {categories.map(cat => (
                    <AccordionItem key={cat} value={cat} className="glass-card px-6 py-2 border-none shadow-sm rounded-3xl overflow-hidden">
                        <AccordionTrigger className="text-xl font-bold text-slate-700 hover:no-underline hover:text-[var(--primary)] py-4">
                            {cat}
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {KPI_LIST.filter(k => k.category === cat).map(kpi => (
                                    <div key={kpi.id} className="p-5 rounded-2xl bg-white/50 border border-white/60 hover:border-orange-200 transition-colors shadow-sm">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-bold text-slate-800">{kpi.title}</label>
                                            {/* Helper/Viz tag */}
                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 uppercase tracking-wide">
                                                {kpi.visualization}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {kpi.inputs.map(input => (
                                                <div key={input.id}>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">{input.label}</label>
                                                    <Input
                                                        value={formData[kpi.id]?.[input.id] || ""}
                                                        onChange={(e) => handleChange(kpi.id, input.id, e.target.value)}
                                                        placeholder={input.placeholder}
                                                        className="glass-input h-11 bg-white/70 border-slate-200 focus:border-[var(--primary)] font-semibold text-slate-700 rounded-xl"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
