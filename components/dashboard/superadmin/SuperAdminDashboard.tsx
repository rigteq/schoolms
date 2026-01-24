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
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-muted-foreground">Manage the entire school ecosystem from a single point.</p>
                </div>
                <div className="flex gap-2">
                    <Button className="hidden md:flex">
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
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <StatsCard
                    title="Total Students"
                    value={loading ? "..." : stats.students}
                    icon={Users}
                    description="Enrolled across network"
                    color="text-green-600"
                    bg="bg-green-100"
                />
                <StatsCard
                    title="Total Teachers"
                    value={loading ? "..." : stats.teachers}
                    icon={GraduationCap}
                    description="Qualified educators"
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
                <StatsCard
                    title="Active Classes"
                    value={loading ? "..." : stats.classes}
                    icon={BookOpen}
                    description="Ongoing sessions"
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    <ActionCard
                        title="Add School"
                        icon={School}
                        description="Register a new institution"
                        trigger={<Button className="w-full">Create School</Button>}
                        content={<AddSchoolForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Admin"
                        icon={Users}
                        description="Create a school administrator"
                        trigger={<Button className="w-full">Create Admin</Button>}
                        content={<AddAdminForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Class"
                        icon={BookOpen}
                        description="Create a new class for a school"
                        trigger={<Button className="w-full">Create Class</Button>}
                        content={<AddClassForm onSuccess={() => mutate()} />}
                    />
                    <ActionCard
                        title="Add Teacher"
                        icon={GraduationCap}
                        description="Onboard a new teacher"
                        trigger={<Button className="w-full">Onboard Teacher</Button>}
                        content={<AddProfileForm roleName="Teacher" onSuccess={() => mutate()} />}
                    />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    {/* Row 2 Actions if needed */}
                    <ActionCard
                        title="Add Student"
                        icon={Users}
                        description="Enroll a new student"
                        trigger={<Button className="w-full">Enroll Student</Button>}
                        content={<AddProfileForm roleName="Student" onSuccess={() => mutate()} />}
                    />
                </div>
            </div>

            {/* Recent Activity (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest system-wide events and updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-8">
                        No recent activity to show.
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

function ActionCard({ title, icon: Icon, description, trigger, content }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    trigger: React.ReactNode;
    content: React.ReactNode;
}) {
    return (
        <Card className="flex flex-col justify-between">
            <CardHeader>
                <div className="bg-primary/10 w-fit p-3 rounded-xl mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Dialog>
                    <DialogTrigger asChild>
                        {trigger}
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{title}</DialogTitle>
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
