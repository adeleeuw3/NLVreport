"use client";

import React, { useState } from "react";
import { KPI_LIST, KPICategory } from "@/lib/kpi-definitions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StorageService } from "@/lib/storage-service";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Save, UploadCloud, FolderOpen, Play, Sparkles, Trash2, LogOut } from "lucide-react";

interface MegaInputFormProps {
    onGenerate: (data: any, previousData: any | null) => void;
    uid: string;
}

export function MegaInputForm({ onGenerate, uid }: MegaInputFormProps) {
    // State for multi-selection
    const [selectedMonths, setSelectedMonths] = useState<string[]>(["Jan"]);
    const [formData, setFormData] = useState<any>({});
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState<string>("");
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

    // Derived label for save/display
    const displayMonth = selectedMonths.length === 12 ? "Year" : selectedMonths.length === 1 ? selectedMonths[0] : "Multi";
    // Derived for backward compatibility in render (strictly for "Year" check) or current single selection
    const isYearMode = selectedMonths.length === 12;

    const handleGenerate = async () => {
        // Comparison removed as per request
        onGenerate(formData, null);
    };

    const handleSelectYear = () => {
        const all = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        setSelectedMonths(all);
        loadMergedData(all);
    };

    const loadMergedData = async (monthsToLoad: string[]) => {
        setStatus("Loading...");
        try {
            const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const reports = await Promise.all(monthsToLoad.map(m => StorageService.getReport(uid, m, year)));

            const mergedData: any = {};
            let foundAny = false;
            let loadedTitle = "";

            KPI_LIST.forEach(kpi => {
                const kpiData: any = {};
                kpi.inputs.forEach(input => {
                    if (input.type === "array") {
                        const mergedArr = allMonths.map((m, i) => {
                            if (monthsToLoad.includes(m)) {
                                const reportIndex = monthsToLoad.indexOf(m);
                                const report = reports[reportIndex];
                                if (report?.data?.[kpi.id]?.[input.id]) { // Safety check
                                    foundAny = true;
                                    if (report.title) loadedTitle = report.title;
                                    const valArray = (report.data[kpi.id][input.id] || "").split(",").map((s: string) => s.trim());
                                    return valArray[i] || "";
                                }
                            } else {
                                // Preserve existing data for unselected months if needed, or just keep what's in formData
                                // Actually, simpler to just use what's in formData if not loading
                                const currentArr = (formData[kpi.id]?.[input.id] || "").split(",").map((s: string) => s.trim());
                                return currentArr[i] || "";
                            }
                            return "";
                        });
                        kpiData[input.id] = mergedArr.join(",");
                    } else {
                        // For non-array, we just take the LAST selected month's value usually, or the first? 
                        // Let's take the first found valid value from the selected months (reverse order to prioritize later months?)
                        kpiData[input.id] = "";
                        for (let i = reports.length - 1; i >= 0; i--) {
                            if (reports[i]?.data?.[kpi.id]?.[input.id]) {
                                kpiData[input.id] = reports[i].data![kpi.id][input.id];
                                break;
                            }
                        }
                    }
                });
                mergedData[kpi.id] = kpiData;
            });

            setFormData(mergedData);
            if (loadedTitle) setTitle(loadedTitle);
            setStatus(foundAny ? "Loaded!" : "New Draft");
            setTimeout(() => setStatus(""), 1000);
        } catch (e) {
            console.error(e);
            setStatus("Error");
        }
    };

    const toggleMonth = (m: string) => {
        let newSelection = [...selectedMonths];
        // If currently only "Year" (all 12) is implicitly selected or explicit array
        // If user creates a custom selection, we just toggle.
        if (newSelection.length === 12 && newSelection.every(mo => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].includes(mo))) {
            // If we are in "Year" mode and click one, do we deselect it? Yes.
        }

        if (newSelection.includes(m)) {
            newSelection = newSelection.filter(x => x !== m);
        } else {
            newSelection.push(m);
        }

        // Sort selection chronologically
        const all = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        newSelection.sort((a, b) => all.indexOf(a) - all.indexOf(b));

        // Enforce at least one month must be selected? Or allow empty? Allow empty is risky. 
        // If empty, maybe default to Jan? Or current clicked? 
        if (newSelection.length === 0) newSelection = [m]; // Toggle back on if it was the last one? Or just allow empty. 
        // Let's ensure at least one.
        if (newSelection.length === 0) newSelection = [m];

        setSelectedMonths(newSelection);
        loadMergedData(newSelection);
    };

    const categories = Array.from(new Set(KPI_LIST.map(k => k.category))) as KPICategory[];

    const handleChange = (kpiId: string, inputId: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [kpiId]: {
                ...prev[kpiId],
                [inputId]: value
            }
        }));
    };

    const handleSave = async () => {
        setStatus("Saving...");
        try {
            const promises = selectedMonths.map(m =>
                StorageService.saveReport(uid, m, year, formData, title)
            );
            await Promise.all(promises);
            setStatus("Saved All!");
            await refreshSavedMonths();
            setTimeout(() => setStatus(""), 2000);
        } catch (e) {
            setStatus("Error Saving");
        }
    };

    const [savedMonths, setSavedMonths] = useState<string[]>([]);

    const refreshSavedMonths = async () => {
        const saved = await StorageService.getSavedMonths(uid, year);
        setSavedMonths(saved);
    };

    const handleLogout = () => {
        signOut(auth);
    };

    const handleClear = async () => {
        if (!isDeleteConfirm) {
            setIsDeleteConfirm(true);
            setTimeout(() => setIsDeleteConfirm(false), 3000);
            return;
        }
        setIsDeleteConfirm(false);

        setStatus("Deleting...");
        try {
            const promises = selectedMonths.map(m =>
                StorageService.deleteReport(uid, m, year)
            );
            await Promise.all(promises);

            await loadMergedData(selectedMonths);
            await refreshSavedMonths();

            setStatus("Deleted!");
            setTimeout(() => setStatus(""), 2000);
        } catch (e) {
            console.error(e);
            setStatus("Error Clearing");
        }
    };




    const fillDemoData = (mode: "full" | "month") => {
        const demo: any = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthIdx = months.indexOf(selectedMonths[0]);

        KPI_LIST.forEach(kpi => {
            const kpiData: any = {};
            kpi.inputs.forEach(input => {
                const baseVal = Math.floor(Math.random() * 50) + 10;

                if (input.type === "array") {
                    if (mode === "full") {
                        const arr = Array.from({ length: 12 }, () => Math.floor(baseVal + (Math.random() * 20) - 10));
                        kpiData[input.id] = arr.join(", ");
                    } else {
                        const arr = Array(12).fill("");
                        // If "Year" is selected (index -1), we might default to random, or fill all? 
                        // If user clicks "One Month" while in Year view, what happens? Let's just fill index 0 or random.
                        // Or better, "One Month" implies CURRENT. If Year, maybe we fill nothing? 
                        // Let's assume user is smart.
                        const idx = currentMonthIdx !== -1 ? currentMonthIdx : 0;
                        arr[idx] = (baseVal + 5).toString();
                        kpiData[input.id] = arr.join(",");
                    }
                } else {
                    if (input.id.includes("percent")) {
                        kpiData[input.id] = (Math.floor(Math.random() * 40) + 60).toString();
                    } else {
                        kpiData[input.id] = (baseVal * 2).toString();
                    }
                }
            });
            demo[kpi.id] = kpiData;
        });
        setFormData(demo);
    };

    // Refresh saved months when Date/User changes or after Save
    React.useEffect(() => {
        refreshSavedMonths();
    }, [uid, year]); // Status removed as dependency since we call refresh manually now



    return (
        <div className="w-full max-w-4xl mx-auto pb-20">
            {/* HEADER */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">KPI Data Entry</h1>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold uppercase tracking-wider border border-[var(--primary)]/20">
                            {displayMonth} {year}
                        </span>
                        {status && (
                            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                                {status}
                            </span>
                        )}
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-slate-800">
                    <LogOut size={16} className="mr-2" /> Log Out
                </Button>
            </div>
            {/* DATA MANAGEMENT & NAVIGATION */}
            <div className="glass-card p-6 mb-6 bg-white/90 border-l-4 border-[var(--primary)] shadow-sm">
                <div className="flex flex-col gap-6">
                    {/* Top Row: Year & Save Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-slate-800">1. Select Period</h2>
                            <select
                                value={year}
                                onChange={e => setYear(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-lg font-bold text-slate-700 rounded-md py-1 px-3 focus:ring-2 focus:ring-[var(--primary)]"
                            >
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            {status && <span className="text-xs font-bold text-[var(--primary)] animate-pulse uppercase tracking-wider mr-2">{status}</span>}
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="h-9 w-48 bg-white text-xs"
                                placeholder="Report Title (Optional)"
                            />
                            <Button size="sm" onClick={handleSave} className="bg-slate-800 hover:bg-slate-900 text-white shadow-md">
                                <Save size={16} className="mr-2" /> Save {displayMonth}
                            </Button>
                            <Button
                                size="sm"
                                variant={isDeleteConfirm ? "destructive" : "outline"}
                                onClick={handleClear}
                                className={`shadow-md transition-all ${isDeleteConfirm ? "bg-red-600 hover:bg-red-700 text-white min-w-[70px]" : "border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200"}`}
                            >
                                {isDeleteConfirm ? <span className="text-xs font-bold">Sure?</span> : <Trash2 size={16} />}
                            </Button>
                        </div>
                    </div>

                    {/* Month Selector Grid */}
                    <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => {
                            const isSaved = savedMonths.includes(m);
                            const isSelected = selectedMonths.includes(m);
                            return (
                                <button
                                    key={m}
                                    onClick={() => toggleMonth(m)}
                                    className={`
                                        relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200
                                        ${isSelected
                                            ? "border-[var(--primary)] bg-[var(--primary)]/5 ring-1 ring-[var(--primary)] shadow-inner"
                                            : "border-slate-100 bg-white hover:border-[var(--primary)]/50 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <span className={`text-xs font-bold ${isSelected ? "text-[var(--primary)]" : "text-slate-600"}`}>{m}</span>
                                    {/* Status Indicator */}
                                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${isSaved ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" : "bg-slate-200"}`} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Year Selector & Select All */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                        <button
                            onClick={handleSelectYear}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
                                ${isYearMode
                                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }
                            `}
                        >
                            <span className="text-xs font-bold">Year / All Months</span>
                            {savedMonths.includes("Year") && <div className="h-1.5 w-1.5 rounded-full bg-amber-500 ml-1" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">1. Input Data</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fillDemoData("month")} className="text-slate-600 border-slate-300 hover:bg-slate-50">
                        <Sparkles size={14} className="mr-2" /> One Month
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fillDemoData("full")} className="text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/10">
                        <Sparkles size={14} className="mr-2" /> Full Year
                    </Button>
                </div>
            </div>

            <Accordion type="multiple" defaultValue={["General", "Sales"]} className="w-full space-y-4">
                {categories.map(cat => (
                    <AccordionItem key={cat} value={cat} className="glass-card px-4 border-none bg-white/60">
                        <AccordionTrigger className="text-lg font-semibold text-slate-700 hover:no-underline hover:text-[var(--primary)]">
                            {cat} KPIs
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {KPI_LIST.filter(k => k.category === cat).map(kpi => (
                                    <div key={kpi.id} className="p-4 rounded-lg bg-white/40 border border-white/50 shadow-sm transition-all hover:bg-white/60">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-sm font-bold text-slate-800">{kpi.title}</label>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{kpi.visualization}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {kpi.inputs.map(input => (
                                                <div key={input.id}>
                                                    <p className="text-xs font-semibold text-slate-600 mb-1.5">{input.label}</p>

                                                    {input.type === "array" ? (
                                                        // GRID INPUT FOR ARRAYS - 12 Slots for Months (or filtered)
                                                        <div className="bg-white/50 rounded-lg p-2 border border-slate-200">
                                                            <div className={`grid gap-2 ${isYearMode ? "grid-cols-6" : "grid-cols-1 md:grid-cols-3"}`}>
                                                                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                                                                    .map((label, i) => ({ label, i }))
                                                                    .filter(item => isYearMode || selectedMonths.includes(item.label))
                                                                    .map(({ label, i }) => {
                                                                        const currentArr = (formData[kpi.id]?.[input.id] || "").split(",").map((s: string) => s.trim());
                                                                        const currentVal = currentArr[i] || "";
                                                                        return (
                                                                            <div key={i} className="flex flex-col">
                                                                                <label className="text-[9px] text-slate-500 text-center mb-0.5 font-bold uppercase">{label}</label>
                                                                                <Input
                                                                                    value={currentVal}
                                                                                    onChange={(e) => {
                                                                                        const newVal = e.target.value;
                                                                                        // Construct new array string
                                                                                        const newArr = (formData[kpi.id]?.[input.id] || "").split(",").map((s: string) => s.trim());
                                                                                        // Ensure array has enough slots
                                                                                        while (newArr.length <= 11) newArr.push("");
                                                                                        newArr[i] = newVal;
                                                                                        // Join back to string
                                                                                        handleChange(kpi.id, input.id, newArr.join(","))
                                                                                    }}
                                                                                    className={`h-7 text-xs px-1 text-center bg-white ${!isYearMode ? "h-9 text-sm" : ""}`}
                                                                                    placeholder="-"
                                                                                />
                                                                            </div>
                                                                        )
                                                                    })}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                                                                {isYearMode ? "Fill up to 12 months" : `Input for ${displayMonth}`}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        // STANDARD INPUT
                                                        <Input
                                                            value={formData[kpi.id]?.[input.id] || ""}
                                                            onChange={(e) => handleChange(kpi.id, input.id, e.target.value)}
                                                            placeholder={input.placeholder}
                                                            className="bg-white"
                                                        />
                                                    )}
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

            <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <Button
                    onClick={handleGenerate}
                    size="lg"
                    className="pointer-events-auto shadow-2xl scale-110 hover:scale-125 transition-transform bg-[var(--primary)] hover:bg-[var(--secondary)] text-white font-bold rounded-full px-12"
                >
                    <Play size={20} className="mr-2 fill-white" /> GENERATE DASHBOARD
                </Button>
            </div>
        </div>
    );
}
