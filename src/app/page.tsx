"use client";
import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LoginForm } from '@/components/LoginForm';
import { MegaInputForm } from '@/components/MegaInputForm';
import { StoryDashboard } from '@/components/StoryDashboard';
import { DashboardLibrary } from '@/components/DashboardLibrary';

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("library"); // Start with library
    const [data, setData] = useState<any>(null);
    const [prevData, setPrevData] = useState<any>(null);
    const [dashboardTitle, setDashboardTitle] = useState("");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleGenerate = (formData: any, previousData: any) => {
        setData(formData);
        setPrevData(previousData);
        setView("dashboard");
    };

    const handleLoadDashboard = (formData: any, title: string) => {
        setData(formData);
        setPrevData(null);
        setDashboardTitle(title);
        setView("dashboard");
    };

    const handleCreateNew = () => {
        setData(null);
        setPrevData(null);
        setDashboardTitle("");
        setView("input");
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-400">Loading...</div>;

    if (!user) return <LoginForm onLogin={(u) => setUser(u)} />;

    return (
        <main className="min-h-screen bg-slate-50">
            {view === "library" && (
                <DashboardLibrary
                    uid={user.uid}
                    onLoadDashboard={handleLoadDashboard}
                    onCreateNew={handleCreateNew}
                />
            )}
            {view === "input" && (
                <MegaInputForm onGenerate={handleGenerate} uid={user.uid} />
            )}
            {view === "dashboard" && (
                <StoryDashboard
                    formData={data}
                    previousData={prevData}
                    onBack={() => setView("library")}
                    onSave={(title) => setDashboardTitle(title)}
                    uid={user.uid}
                    initialTitle={dashboardTitle}
                />
            )}
        </main>
    );
}
