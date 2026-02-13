"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Clock, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function StudentDashboard() {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold gradient-text-primary tracking-tight">Student Dashboard</h2>
                    <p className="text-slate-600 mt-2">Track your academic progress.</p>
                </div>
            </div>

            {/* Student Info Card */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="gradient-text-primary">Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-slate-600">Name</p>
                            <p className="text-lg font-semibold text-slate-900">{profile?.full_name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Email</p>
                            <p className="text-lg font-semibold text-slate-900">{profile?.email || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Role</p>
                            <p className="text-lg font-semibold text-slate-900">Student</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="My Classes"
                    value="0"
                    icon={BookOpen}
                    description="Enrolled classes"
                    color="from-blue-600 to-cyan-500"
                />
                <StatsCard
                    title="Current GPA"
                    value="--"
                    icon={Award}
                    description="Overall performance"
                    color="from-green-500 to-emerald-500"
                />
                <StatsCard
                    title="Pending Assignments"
                    value="0"
                    icon={Clock}
                    description="To be submitted"
                    color="from-orange-500 to-red-500"
                />
                <StatsCard
                    title="Completed Tasks"
                    value="0"
                    icon={GraduationCap}
                    description="This semester"
                    color="from-purple-600 to-pink-500"
                />
            </div>

            {/* Navigation Links */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="gradient-text-primary">Learning Resources</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <NavLink href="/dashboard/classes" icon={BookOpen} title="My Classes" description="View enrolled classes" />
                        <NavLink href="/dashboard/assignments" icon={Clock} title="Assignments" description="View and submit assignments" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, description, color }: any) {
    return (
        <Card className="hover-card border-indigo-100 bg-white/80 backdrop-blur overflow-hidden relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
                <div className={`bg-gradient-to-br ${color} p-2 rounded-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="relative">
                <div className="text-3xl font-bold text-slate-900">{value}</div>
                <p className="text-xs text-slate-600 mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}

function NavLink({ href, icon: Icon, title, description }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}) {
    return (
        <a href={href} className="block p-4 border-2 border-indigo-100 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all group bg-white/80">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg">
                    <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-600">{description}</p>
                </div>
            </div>
        </a>
    );
}
