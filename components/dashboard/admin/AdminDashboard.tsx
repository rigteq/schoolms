"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, BarChart3, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import AddProfileForm from "@/components/dashboard/forms/AddProfileForm";
import AddClassForm from "@/components/dashboard/forms/AddClassForm";
import { useSchoolStats } from "@/lib/hooks/useData";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
    const { profile, isLoading: authLoading } = useAuth();
    const [schoolName, setSchoolName] = useState("Your School");
    const schoolId = profile?.school_id;

    const { stats, loading: statsLoading } = useSchoolStats(schoolId);

    useEffect(() => {
        if (schoolId) {
            supabase.from('schools').select('school_name').eq('id', schoolId).single().then(({ data }) => {
                if (data) setSchoolName(data.school_name);
            });
        }
    }, [schoolId]);

    if (authLoading || statsLoading) {
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
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Manage {schoolName} data and users.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Teachers" value={stats.teachers} icon={GraduationCap} />
                <StatsCard title="Active Students" value={stats.students} icon={Users} />
                <StatsCard title="Total Classes" value={stats.classes} icon={BookOpen} />
                <StatsCard title="School Profile" value={schoolName} icon={BarChart3} isText />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    <ActionCard
                        title="Add Teacher"
                        icon={GraduationCap}
                        description="Onboard a new teacher"
                        trigger={<Button className="w-full">Add Teacher</Button>}
                        content={<AddProfileForm roleName="Teacher" defaultSchoolId={schoolId} />}
                    />
                    <ActionCard
                        title="Add Student"
                        icon={Users}
                        description="Enroll a new student"
                        trigger={<Button className="w-full">Add Student</Button>}
                        content={<AddProfileForm roleName="Student" defaultSchoolId={schoolId} />}
                    />
                    <ActionCard
                        title="Create Class"
                        icon={BookOpen}
                        description="Create a new class"
                        trigger={<Button className="w-full">Create Class</Button>}
                        content={<AddClassForm defaultSchoolId={schoolId} />}
                    />
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, isText = false }: { title: string, value: string | number, icon: any, isText?: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${isText ? "text-lg truncate" : ""}`}>{value}</div>
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
        <Dialog>
            <Card className="hover-card cursor-pointer transition-all hover:shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <DialogTrigger asChild>
                        {trigger}
                    </DialogTrigger>
                </CardContent>
            </Card>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="p-4">
                    {content}
                </div>
            </DialogContent>
        </Dialog>
    );
}
