"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from '@/components/LoginForm';
import { KPIDataHub } from '@/components/KPIDataHub';
import { MonthlyDataEntry } from '@/components/MonthlyDataEntry';
import { StoryBuilderWizard } from '@/components/StoryBuilderWizard';
import { StoryDashboard } from '@/components/StoryDashboard';

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // NAVIGATION STATE
    const [view, setView] = useState<"hub" | "entry" | "wizard" | "dashboard">("hub");

    // DATA ENTRY STATE
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");

    // DASHBOARD STATE
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [dashboardTitle, setDashboardTitle] = useState("");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // 1. HUB -> ENTRY
    const handleSelectMonth = (month: string, year: string) => {
        setSelectedMonth(month);
        setSelectedYear(year);
        setView("entry");
    };

    // 2. HUB -> WIZARD
    const handleCreateStory = () => {
        setView("wizard");
    };

    // 3. HUB -> DASHBOARD (Load Snapshot)
    const handleLoadDashboard = (data: any, title: string) => {
        setDashboardData(data);
        setDashboardTitle(title);
        setView("dashboard");
    };

    // 4. WIZARD -> DASHBOARD
    const handleGenerateStory = (data: any, title: string) => {
        setDashboardData(data);
        setDashboardTitle(title);
        setView("dashboard");
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>;

    if (!user) return <LoginForm onLogin={(u) => setUser(u)} />;

    return (
        <main className="min-h-screen bg-slate-50">
            {view === "hub" && (
                <KPIDataHub
                    uid={user.uid}
                    onSelectMonth={handleSelectMonth}
                    onCreateStory={handleCreateStory}
                    onLoadDashboard={handleLoadDashboard}
                />
            )}

            {view === "entry" && (
                <MonthlyDataEntry
                    uid={user.uid}
                    month={selectedMonth}
                    year={selectedYear}
                    onBack={() => setView("hub")}
                />
            )}

            {view === "wizard" && (
                <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100/50">
                    <StoryBuilderWizard
                        uid={user.uid}
                        onGenerate={handleGenerateStory}
                        onCancel={() => setView("hub")}
                    />
                </div>
            )}

            {view === "dashboard" && (
                <StoryDashboard
                    formData={dashboardData}
                    previousData={null} // Wizard now handles all data in formData (including trends)
                    onBack={() => setView("hub")}
                    onSave={(title) => setDashboardTitle(title)}
                    uid={user.uid}
                    initialTitle={dashboardTitle}
                    onEditScope={() => setView("wizard")}
                />
            )}
        </main>
    );
}
