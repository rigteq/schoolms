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
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
                    <p className="text-muted-foreground">Track your academic progress.</p>
                </div>
            </div>

            {/* Student Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="text-lg font-semibold">{profile?.full_name || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-lg font-semibold">{profile?.email || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="text-lg font-semibold">Student</p>
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
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <StatsCard
                    title="Current GPA"
                    value="--"
                    icon={Award}
                    description="Overall performance"
                    color="text-green-600"
                    bg="bg-green-100"
                />
                <StatsCard
                    title="Pending Assignments"
                    value="0"
                    icon={Clock}
                    description="To be submitted"
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
                <StatsCard
                    title="Completed Tasks"
                    value="0"
                    icon={GraduationCap}
                    description="This semester"
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
            </div>

            {/* Navigation Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
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

function StatsCard({ title, value, icon: Icon, description, color, bg }: any) {
    return (
        <Card className="hover-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`${bg} p-2 rounded-full`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
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
        <a href={href} className="block p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary" />
                <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </a>
    );
}
