"use client";

import React, { useEffect, useState } from "react";
import { KPIDefinition } from "@/lib/kpi-definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { EuropeMap } from "./EuropeMap";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

import { ComparisonResult } from "@/lib/comparison-utils";

interface KPICardProps {
    definition: KPIDefinition;
    data: any[];
    ghostData?: any[] | null;
    comparison?: ComparisonResult | null;
    title?: string;
    className?: string;
}

const DiffBadge = ({ result }: { result: ComparisonResult }) => {
    if (!result || result.trend === "neutral") return null;
    const isUp = result.trend === "up";
    const colorClass = isUp ? "text-emerald-500 bg-emerald-50 border-emerald-100" : "text-rose-500 bg-rose-50 border-rose-100";
    const Icon = isUp ? "↑" : "↓";
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${colorClass} ml-2 flex items-center gap-1`}>
            {Icon} {result.formattedChange}
        </span>
    );
};

// THEME CONFIGURATION
const CATEGORY_COLORS: Record<string, string> = {
    General: "#FF914D",   // Orange (Brand)
    Sales: "#3B82F6",     // Blue
    Community: "#14B8A6", // Teal
    Marketing: "#8B5CF6", // Violet
    People: "#EC4899",    // Pink
    Helpdesk: "#06B6D4",  // Cyan
    Production: "#6366F1",// Indigo
};

const getThemeColor = (category: string) => CATEGORY_COLORS[category] || "#FF914D";

// Simple CountUp Component
const AnimatedCounter = ({ value, color }: { value: number | string, color: string }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const target = Number(String(value).replace(/[^0-9.-]+/g, ""));
    const isNumber = !isNaN(target);

    useEffect(() => {
        if (!isNumber) return;
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // EaseOutQuart
            const ease = 1 - Math.pow(1 - progress, 4);

            const current = Math.floor(start + (target - start) * ease);
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [target, isNumber]);

    if (!isNumber) return <span style={{ color }}>{value}</span>;

    return (
        <span
            className="text-6xl font-black text-transparent bg-clip-text"
            style={{ backgroundImage: `linear-gradient(135deg, ${color}, #1e293b)` }}
        >
            {displayValue}
        </span>
    );
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-card p-3 text-xs text-slate-700 bg-white/95 backdrop-blur-xl border border-white/60 shadow-xl rounded-xl">
                <p className="font-bold mb-1.5 text-slate-800">{label}</p>
                <div className="flex flex-col gap-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                            <span className="font-medium text-slate-600">{entry.name}:</span>
                            <span className="font-bold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function KPICard({ definition, data, ghostData, comparison }: KPICardProps) {
    const { visualization, title, category } = definition;
    const themeColor = getThemeColor(category);

    const renderChart = () => {
        // Empty State
        if (!data || data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">No Data Available</div>;

        const gradId = `grad-${category}`;

        switch (visualization) {
            case "AreaChart":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={themeColor} stopOpacity={0.6} />
                                    <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={5} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                            {/* GHOST LINE (Previous Month) */}
                            {definition.id && ghostData && (
                                <Area
                                    dataKey="value"
                                    data={ghostData}
                                    type="monotone"
                                    stroke="#e2e8f0"
                                    fill="none"
                                    strokeWidth={2}
                                    strokeDasharray="4 4"
                                    isAnimationActive={false}
                                />
                            )}

                            <Area type="monotone" dataKey="value" stroke={themeColor} strokeWidth={3} fillOpacity={1} fill={`url(#${gradId})`} activeDot={{ r: 6, strokeWidth: 0, fill: themeColor }} />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case "LineChart":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#cbd5e1" }} />
                            {/* Show Legend only if we have multiple lines or explicit names */}
                            {(data[0]?.value2 !== undefined || definition.lineNames) && (
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                            )}

                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={5} />

                            {/* Left Axis (Primary) */}
                            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />

                            {/* Right Axis (Secondary) - Only if value2 exists */}
                            {data[0]?.value2 !== undefined && (
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                            )}

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                            {/* Line 1 (Primary) */}
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="value"
                                name={definition.lineNames?.[0] || "Value"}
                                stroke={themeColor}
                                strokeWidth={3}
                                dot={{ r: 4, fill: "white", stroke: themeColor, strokeWidth: 2 }}
                                activeDot={{ r: 7, strokeWidth: 0, fill: themeColor }}
                            />

                            {/* Line 2 (Secondary) */}
                            {data[0]?.value2 !== undefined && (
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="value2"
                                    name={definition.lineNames?.[1] || "Secondary"}
                                    stroke="#64748b" // Slate-500 for secondary
                                    strokeDasharray="5 5" // Dashed
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "white", stroke: "#64748b", strokeWidth: 2 }}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case "BarChart":
            case "GroupedBar":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={5} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Bar dataKey="value" name="Value" fill={themeColor} radius={[6, 6, 0, 0]} maxBarSize={60} />
                            {data[0]?.value2 !== undefined && (
                                <Bar dataKey="value2" name="Secondary" fill={themeColor} fillOpacity={0.4} radius={[6, 6, 0, 0]} maxBarSize={60} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case "Map":
                const mapData = {
                    nl: data.find(d => d.name === "NL")?.value || 0,
                    be: data.find(d => d.name === "BE")?.value || 0,
                    de: data.find(d => d.name === "DE")?.value || 0,
                };
                return <EuropeMap data={mapData} />;

            case "Sparkline":
                const currentVal = Number(data[0]?.current || data[data.length - 1]?.value) || 0;
                const prevVal = Number(data[data.length - 2]?.value || currentVal) || 0;
                const diff = currentVal - prevVal;
                const percent = prevVal !== 0 ? ((diff / prevVal) * 100).toFixed(1) : "0";
                const isPos = diff >= 0;

                return (
                    <div className="flex flex-col h-full justify-between pb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-bold tracking-tight text-slate-800">{currentVal}</span>
                            <span className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isPos ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {isPos ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                                {Math.abs(Number(percent))}%
                            </span>
                        </div>
                        <div className="h-[60px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id={`spark-${category}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={themeColor} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={themeColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke={themeColor} fill={`url(#spark-${category})`} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case "Donut":
                const donutColors = [themeColor, `${themeColor}99`, `${themeColor}66`, `${themeColor}33`, "#cbd5e1"];
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={donutColors[index % 5]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: "10px", color: "#64748b" }} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case "Radar":
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                            <Radar name="Value" dataKey="value" stroke={themeColor} fill={themeColor} fillOpacity={0.5} />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                );

            case "Kanban":
            case "Leaderboard":
            case "Gauge":
            case "Progress":
            case "Counter":
                return <div className="flex items-center justify-center h-full w-full">{renderMiscCharts(visualization, data, themeColor)}</div>;

            default:
                if (visualization === "Map") {
                    const mData = { nl: data.find(d => d.name === "NL")?.value || 0, be: data.find(d => d.name === "BE")?.value || 0, de: data.find(d => d.name === "DE")?.value || 0 };
                    return <EuropeMap data={mData} />;
                }
                return <div className="flex items-center justify-center h-full text-slate-400">?</div>;
        }
    };

    const renderMiscCharts = (type: string, data: any[], color: string) => {
        if (type === "Counter") return (
            <div className="flex flex-col items-center justify-center">
                <AnimatedCounter value={data[0]?.value} color={color} />
                <span className="text-xs uppercase font-bold text-slate-400 mt-2 tracking-widest">{definition.description || "Count"}</span>
            </div>
        );
        if (type === "Kanban") return (
            <div className="grid grid-cols-3 gap-3 w-full h-full items-center">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center justify-center h-20 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                        <span className="text-3xl font-bold" style={{ color: color }}>{item.value}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">{item.name}</span>
                    </div>
                ))}
            </div>
        );
        if (type === "Leaderboard") {
            // AUTO-SORT logic
            const sortedData = [...data].sort((a, b) => {
                const valA = Number(a.value);
                const valB = Number(b.value);
                return (isNaN(valB) ? 0 : valB) - (isNaN(valA) ? 0 : valA);
            });

            return (
                <div className="w-full h-full overflow-auto custom-scrollbar pr-2">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-100">
                            <tr><th className="py-2 pl-2">Rank</th><th className="py-2">Name</th><th className="py-2 text-right pr-2">Value</th></tr>
                        </thead>
                        <tbody>
                            {sortedData.map((item, i) => (
                                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="py-2 pl-2 font-bold text-slate-300">#{i + 1}</td>
                                    <td className="py-2 font-medium text-slate-700 truncate max-w-[100px]">{item.name}</td>
                                    <td className="py-2 pr-2 text-right font-bold" style={{ color: color }}>{item.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        if (type === "Gauge") {
            let rawVal = Number(data[0]?.value);
            if (isNaN(rawVal)) rawVal = 0;
            const percentage = Math.min(Math.max(rawVal, 0), 100);
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="relative w-36 h-18 overflow-hidden mt-4">
                        <div className="absolute top-0 left-0 w-full h-36 rounded-full border-[14px] border-slate-100 box-border"></div>
                        <div className="absolute top-0 left-0 w-full h-36 rounded-full border-[14px] box-border origin-center transition-all duration-1000 ease-out" style={{ borderColor: color, transform: `rotate(${percentage * 1.8 - 180}deg)` }}></div>
                    </div>
                    <div className="text-3xl font-bold text-slate-800 mt-[-20px]">{percentage}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-2">Current Score</div>
                </div>
            );
        }
        if (type === "Progress") {
            let rawVal = Number(data[0]?.value);
            if (isNaN(rawVal)) rawVal = 0;
            const val = Math.min(Math.max(rawVal, 0), 100);
            return (
                <div className="flex flex-col justify-center h-full px-4 w-full">
                    <div className="flex justify-between mb-2 items-end">
                        <span className="text-xs font-bold text-slate-500 uppercase">Completion</span>
                        <span className="text-xl font-bold" style={{ color }}>{val}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full transition-all duration-1000 ease-out flex items-center justify-end pr-2" style={{ width: `${val}%`, backgroundColor: color }}>
                            {val > 20 && <div className="w-1 h-1 bg-white/50 rounded-full animate-pulse" />}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full min-h-[180px] flex flex-col glass-card border-none shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group bg-white">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: themeColor }} />
            <CardHeader className="pb-2 pt-5 px-5 relative z-10 flex flex-row items-center justify-between space-y-0">
                <div>
                    <div className="flex items-center">
                        <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</CardTitle>
                        {comparison && <DiffBadge result={comparison} />}
                    </div>
                    {definition.description && <CardDescription className="text-[10px] text-slate-400 mt-0.5 font-medium">{definition.description}</CardDescription>}
                </div>
                <div className="h-6 w-6 rounded-full flex items-center justify-center opacity-10 group-hover:opacity-100 transition-opacity bg-slate-100">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: themeColor }} />
                </div>
            </CardHeader>
            <CardContent className="flex-1 w-full p-5 pt-2 relative z-10 min-h-0">
                {renderChart()}
            </CardContent>
        </Card>
    );
}
