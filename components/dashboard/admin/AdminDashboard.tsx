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

    const { stats, loading: statsLoading, mutate } = useSchoolStats(schoolId);

    // Dialog open states for auto-close on success
    const [addTeacherOpen, setAddTeacherOpen] = useState(false);
    const [addStudentOpen, setAddStudentOpen] = useState(false);
    const [addClassOpen, setAddClassOpen] = useState(false);

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
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-bold gradient-text-primary tracking-tight">Admin Dashboard</h2>
                    <p className="text-slate-600 mt-2">Managing <strong>{schoolName}</strong> — teachers, students, and classes.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Teachers" value={stats.teachers} icon={GraduationCap} color="from-indigo-500 to-purple-500" />
                <StatsCard title="Active Students" value={stats.students} icon={Users} color="from-cyan-500 to-blue-500" />
                <StatsCard title="Total Classes" value={stats.classes} icon={BookOpen} color="from-orange-500 to-red-500" />
                <StatsCard title="School" value={schoolName} icon={BarChart3} isText color="from-green-500 to-emerald-500" />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-2xl font-bold gradient-text-primary mb-4">Quick Actions</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Add Teacher */}
                    <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
                        <ActionCard
                            title="Add Teacher"
                            icon={GraduationCap}
                            description="Onboard a new teacher"
                            trigger={<DialogTrigger asChild><Button className="w-full gradient-btn">Add Teacher</Button></DialogTrigger>}
                        />
                        <DialogContent className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-indigo-50/30">
                            <DialogHeader>
                                <DialogTitle className="gradient-text-primary">Add Teacher</DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                                <AddProfileForm
                                    roleName="Teacher"
                                    defaultSchoolId={schoolId}
                                    onSuccess={() => { mutate(); setAddTeacherOpen(false); }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Add Student */}
                    <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
                        <ActionCard
                            title="Add Student"
                            icon={Users}
                            description="Enroll a new student"
                            trigger={<DialogTrigger asChild><Button className="w-full gradient-btn-success">Add Student</Button></DialogTrigger>}
                        />
                        <DialogContent className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-indigo-50/30">
                            <DialogHeader>
                                <DialogTitle className="gradient-text-primary">Add Student</DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                                <AddProfileForm
                                    roleName="Student"
                                    defaultSchoolId={schoolId}
                                    onSuccess={() => { mutate(); setAddStudentOpen(false); }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Create Class */}
                    <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
                        <ActionCard
                            title="Create Class"
                            icon={BookOpen}
                            description="Set up a new class"
                            trigger={<DialogTrigger asChild><Button className="w-full gradient-btn-accent">Create Class</Button></DialogTrigger>}
                        />
                        <DialogContent className="max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-indigo-50/30">
                            <DialogHeader>
                                <DialogTitle className="gradient-text-primary">Create Class</DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                                <AddClassForm
                                    defaultSchoolId={schoolId}
                                    onSuccess={() => { mutate(); setAddClassOpen(false); }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, isText = false, color = "from-indigo-500 to-cyan-500" }: {
    title: string;
    value: string | number;
    icon: any;
    isText?: boolean;
    color?: string;
}) {
    return (
        <Card className="hover-card border-indigo-100 bg-white/80 backdrop-blur overflow-hidden relative group">
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="relative">
                <div className={`font-bold text-slate-900 ${isText ? "text-lg truncate" : "text-3xl"}`}>{value}</div>
            </CardContent>
        </Card>
    );
}

function ActionCard({ title, icon: Icon, description, trigger }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    trigger: React.ReactNode;
}) {
    return (
        <Card className="hover-card border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 cursor-pointer transition-all hover:shadow-lg group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <CardHeader className="relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
                        <CardDescription className="text-slate-600">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="relative">
                {trigger}
            </CardContent>
        </Card>
    );
}
