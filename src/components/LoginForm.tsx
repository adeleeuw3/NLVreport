"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Lock, Mail, AlertCircle } from "lucide-react";

export function LoginForm({ onLogin }: { onLogin: (user: any) => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let userCred;
            if (isSignUp) {
                userCred = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCred = await signInWithEmailAndPassword(auth, email, password);
            }
            onLogin(userCred.user);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
            <Card className="w-full max-w-md glass-card bg-white/80 border-white/50 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-[var(--primary)] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-200">
                        <Lock className="text-white" size={20} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                        {isSignUp ? "Create Account" : "Welcome Back"}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                        {isSignUp ? "Sign up to start saving your reports" : "Sign in to access your dashboard"}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="pl-10 bg-white"
                                    placeholder="name@company.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="pl-10 bg-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs text-rose-500 bg-rose-50 p-3 rounded-md flex items-center gap-2 border border-rose-100">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full font-bold shadow-lg shadow-orange-200" disabled={loading}>
                            {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-slate-100 pt-4">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm text-slate-500 hover:text-[var(--primary)] font-medium transition-colors"
                    >
                        {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}
