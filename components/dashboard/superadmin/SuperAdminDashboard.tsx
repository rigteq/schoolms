"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, Users, GraduationCap, BookOpen, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AddSchoolForm from "@/components/dashboard/forms/AddSchoolForm";
import AddClassForm from "@/components/dashboard/forms/AddClassForm";
import AddProfileForm from "@/components/dashboard/forms/AddProfileForm";
import AddAdminForm from "@/components/dashboard/forms/AddAdminForm";
import { useStats } from "@/lib/hooks/useData";

export default function SuperAdminDashboard() {
    const { stats, loading, mutate } = useStats();

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold gradient-text-primary tracking-tight">Dashboard Overview</h2>
                    <p className="text-slate-600 mt-2">Manage the entire school ecosystem from a single point.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="default" className="hidden md:flex">
                        <ExternalLink className="mr-2 h-4 w-4" /> Export Reports
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Schools"
                    value={loading ? "..." : stats.schools}
                    icon={School}
                    description="Active institutions"
                    color="from-blue-600 to-cyan-500"
                />
                <StatsCard
                    title="Total Students"
                    value={loading ? "..." : stats.students}
                    icon={Users}
                    description="Enrolled across network"
                    color="from-green-500 to-emerald-500"
                />
                <StatsCard
                    title="Total Teachers"
                    value={loading ? "..." : stats.teachers}
                    icon={GraduationCap}
                    description="Qualified educators"
                    color="from-purple-600 to-pink-500"
                />
                <StatsCard
                    title="Active Classes"
                    value={loading ? "..." : stats.classes}
                    icon={BookOpen}
                    description="Ongoing sessions"
                    color="from-orange-500 to-red-500"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-2xl font-bold gradient-text-primary mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    <ActionCard
                        title="Add School"
                        icon={School}
                        description="Register a new institution"
                        trigger={<Button className="w-full gradient-btn">Create School</Button>}
                        content={<AddSchoolForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Admin"
                        icon={Users}
                        description="Create a school administrator"
                        trigger={<Button className="w-full gradient-btn-success">Create Admin</Button>}
                        content={<AddAdminForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Class"
                        icon={BookOpen}
                        description="Create a new class for a school"
                        trigger={<Button className="w-full gradient-btn-accent">Create Class</Button>}
                        content={<AddClassForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Teacher"
                        icon={GraduationCap}
                        description="Onboard a new teacher"
                        trigger={<Button className="w-full" variant="secondary">Onboard Teacher</Button>}
                        content={<AddProfileForm roleName="Teacher" onSuccess={() => mutate()} />}
                    />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    {/* Row 2 Actions if needed */}
                    <ActionCard
                        title="Add Student"
                        icon={Users}
                        description="Enroll a new student"
                        trigger={<Button className="w-full" variant="secondary">Enroll Student</Button>}
                        content={<AddProfileForm roleName="Student" onSuccess={() => mutate()} />}
                    />
                </div>
            </div>

            {/* Recent Activity (Placeholder) */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="gradient-text-primary">Recent Activity</CardTitle>
                    <CardDescription className="text-slate-600">Latest system-wide events and updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-slate-500 text-center py-8">
                        No recent activity to show.
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

function ActionCard({ title, icon: Icon, description, trigger, content }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
}) {
    return (
        <Card className="flex flex-col justify-between border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 hover-card group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="relative">
                <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 w-fit p-3 rounded-lg mb-3">
                    <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
                <CardDescription className="text-slate-600">{description}</CardDescription>
            </CardHeader>
            <CardContent className="relative">
                <Dialog>
                    <DialogTrigger asChild>
                        {trigger}
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-indigo-50/30">
                        <DialogHeader>
                            <DialogTitle className="gradient-text-primary">{title}</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            {content}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
