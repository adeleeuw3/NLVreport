"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StorageService } from "@/lib/storage-service";
import { stitchReports } from "@/lib/data-stitcher";
import { Play, Calendar, Check, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";

interface StoryBuilderWizardProps {
    uid: string;
    onGenerate: (data: any, title: string) => void;
    onCancel: () => void;
}

export function StoryBuilderWizard({ uid, onGenerate, onCancel }: StoryBuilderWizardProps) {
    const [step, setStep] = useState(1);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [startMonth, setStartMonth] = useState("Jan");
    const [endMonth, setEndMonth] = useState("Dec");
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");

    // Gap Detection State
    const [savedMonths, setSavedMonths] = useState<string[]>([]);
    const [missingMonths, setMissingMonths] = useState<string[]>([]);

    // Options
    const [showMoM, setShowMoM] = useState(true);

    const { addToast } = useToast();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    useEffect(() => {
        loadSavedMonths();
    }, [uid, year]);

    useEffect(() => {
        checkGaps();
    }, [startMonth, endMonth, savedMonths]);

    const loadSavedMonths = async () => {
        const saved = await StorageService.getSavedMonths(uid, year);
        setSavedMonths(saved);
    };

    const checkGaps = () => {
        const startIdx = months.indexOf(startMonth);
        const endIdx = months.indexOf(endMonth);

        if (startIdx > endIdx) {
            setMissingMonths([]);
            return;
        }

        const range = months.slice(startIdx, endIdx + 1);
        const missing = range.filter(m => !savedMonths.includes(m));
        setMissingMonths(missing);
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Calculate range
            const startIdx = months.indexOf(startMonth);
            const endIdx = months.indexOf(endMonth);

            // Validate
            if (startIdx > endIdx) {
                addToast("Start month must be before end month", "error");
                setLoading(false);
                return;
            }

            const selectedMonths = months.slice(startIdx, endIdx + 1);

            addToast(`Loading data for ${selectedMonths.length} months...`, "info");

            // Load all reports
            const promises = selectedMonths.map(m => StorageService.getReport(uid, m, year));
            const reports = await Promise.all(promises);

            // Stitch
            const stitchedData = stitchReports(reports, selectedMonths);

            // Pass Metadata (Range, Options) inside the data object or separately? 
            // The StoryDashboard might expect "months" metadata.
            stitchedData._meta = {
                year,
                months: selectedMonths,
                rangeLabel: `${startMonth} - ${endMonth} ${year}`,
                showMoM
            };

            // Generate Title if empty
            const finalTitle = title || `${year} ${selectedMonths.length > 1 ? "Performance Story" : "Snapshot"}`;

            onGenerate(stitchedData, finalTitle);

        } catch (e) {
            console.error(e);
            addToast("Failed to generate story", "error");
        }
        setLoading(false);
    };

    // PRESETS
    const setPreset = (preset: "Q1" | "Q2" | "Q3" | "Q4" | "H1" | "H2" | "Full") => {
        if (preset === "Q1") { setStartMonth("Jan"); setEndMonth("Mar"); }
        if (preset === "Q2") { setStartMonth("Apr"); setEndMonth("Jun"); }
        if (preset === "Q3") { setStartMonth("Jul"); setEndMonth("Sep"); }
        if (preset === "Q4") { setStartMonth("Oct"); setEndMonth("Dec"); }
        if (preset === "H1") { setStartMonth("Jan"); setEndMonth("Jun"); }
        if (preset === "H2") { setStartMonth("Jul"); setEndMonth("Dec"); }
        if (preset === "Full") { setStartMonth("Jan"); setEndMonth("Dec"); }
    };

    return (
        <div className="flex items-center justify-center min-h-[600px] w-full max-w-2xl mx-auto py-12">
            <Card className="w-full glass-card border-none shadow-2xl rounded-3xl relative overflow-hidden">
                {/* Decorative background element inside card */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-orange-200/50 rounded-full blur-2xl animate-float" />

                <CardContent className="p-8 md:p-12 relative z-10">
                    <div className="mb-10 text-center">
                        <h2 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">Build Your Story</h2>
                        <p className="text-slate-500 font-medium text-lg">Select the time range for your dashboard.</p>
                    </div>

                    {/* STEP 1: TIME RANGE */}
                    <div className="space-y-10">
                        {/* Year */}
                        <div className="flex justify-center">
                            <div className="glass-panel px-4 py-1 rounded-xl">
                                <select
                                    value={year}
                                    onChange={e => setYear(e.target.value)}
                                    className="bg-transparent border-none text-2xl font-black text-slate-800 rounded-lg py-1 px-4 text-center cursor-pointer focus:ring-0 outline-none"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Range Selectors */}
                        <div className="flex items-center justify-center gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">From</label>
                                <select
                                    value={startMonth}
                                    onChange={e => setStartMonth(e.target.value)}
                                    className="glass-input h-14 text-xl font-bold text-slate-700 rounded-xl px-4 min-w-[120px] text-center"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <ArrowRight className="text-slate-300 mt-8" />

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">To</label>
                                <select
                                    value={endMonth}
                                    onChange={e => setEndMonth(e.target.value)}
                                    className="glass-input h-14 text-xl font-bold text-slate-700 rounded-xl px-4 min-w-[120px] text-center"
                                >
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Gap Warning */}
                        {missingMonths.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-top-2 glass-panel bg-amber-50/50 border-amber-200/50 rounded-xl p-4 flex items-start gap-3 text-amber-800 max-w-sm mx-auto shadow-sm">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-500" />
                                <div>
                                    <p className="text-sm font-bold">Incomplete Data Detected</p>
                                    <p className="text-xs font-medium opacity-90 mt-1">Missing data for: <b>{missingMonths.join(", ")}</b>. Charts may look incomplete.</p>
                                </div>
                            </div>
                        )}

                        {/* Presets */}
                        <div className="flex flex-wrap justify-center gap-2">
                            {["Q1", "Q2", "Q3", "Q4", "H1", "Full"].map((p: any) => (
                                <button
                                    key={p}
                                    onClick={() => setPreset(p)}
                                    className="px-4 py-1.5 rounded-full glass-input text-xs font-bold text-slate-500 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all shadow-sm hover:transform hover:-translate-y-0.5"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>

                        {/* Title Input */}
                        <div className="max-w-xs mx-auto pt-6">
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block text-center tracking-wider">Story Title (Optional)</label>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="e.g. Q1 Sales Review"
                                className="glass-input w-full px-4 py-3 text-center font-bold text-slate-700 rounded-xl focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200/50">
                        <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-800">Cancel</Button>
                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            size="lg"
                            className="liquid-gradient text-white font-bold px-8 py-6 h-auto rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:-translate-y-1"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 fill-current" />}
                            Generate Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
