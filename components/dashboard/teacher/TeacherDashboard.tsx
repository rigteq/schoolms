"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, BarChart3, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TeacherDashboard() {
    const { profile, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState({
        classes: 0,
        students: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!profile?.school_id) return;

            try {
                // Get classes count
                // RLS ensures we only see classes we are allowed to see (which is all in school for now, as per policy? 
                // Wait, policy says "Users view school classes".
                // But for specific teacher, maybe we want ONLY their classes? 
                // The prompt said: "Teacher See Students, Classes from HIS SCHOOL ONLY".
                // So "All classes in school" is acceptable per prompt "from HIS SCHOOL ONLY", 
                // but "Teacher's Dashboard" usually implies THEIR classes.
                // However, let's stick to "School Scope" first or try to filter by teacher_id in classes if schema supports.
                // Schema: teachers_data has class_ids.

                // Let's get "My Classes" from teachers_data
                const { data: teacherData } = await supabase
                    .from("teachers_data")
                    .select("class_ids")
                    .eq("id", profile.id)
                    .single();

                const myClassIds = teacherData?.class_ids || [];
                const classCount = myClassIds.length;

                // Get All Students in School (or my classes?) -> "Teacher See Students... from HIS SCHOOL ONLY".
                // Let's count all students in the school for now, or just My Students?
                // The prompt says "Teacher See Students ... from HIS SCHOOL ONLY". It doesn't explicitly restrict to "My Students".
                // But "Teacher Dashboard" usually implies "My Students".
                // Let's count students in the school for specific stats, or students in "My Classes".

                // Let's go with "All Students in School" as the base metric for "searchability", 
                // but for dashboard stats "My Classes" makes more sense.
                // Let's count students whose class_id is in myClassIds.

                let studentCount = 0;
                if (myClassIds.length > 0) {
                    const { count } = await supabase
                        .from("students_data")
                        .select("*", { count: 'exact', head: true })
                        .in("class_id", myClassIds);
                    studentCount = count || 0;
                }

                setStats({ classes: classCount, students: studentCount });
            } catch (error) {
                console.error("Error fetching teacher stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (profile) fetchStats();
    }, [profile]);

    if (authLoading || loading) {
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
                    <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
                    <p className="text-muted-foreground">Manage your assigned classes and students.</p>
                </div>
            </div>

            {/* Teacher Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Welcome back, {profile?.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">School</p>
                            {/* We can fetch school name or just show ID/Wait */}
                            <p className="text-lg font-semibold truncate" title={profile?.school_id}>
                                {profile?.school_id ? "Your School (Active)" : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-lg font-semibold">{profile?.email || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="text-lg font-semibold">Teacher</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="My Classes"
                    value={stats.classes}
                    icon={BookOpen}
                    description="Assigned classes"
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <StatsCard
                    title="My Students"
                    value={stats.students}
                    icon={Users}
                    description="In your classes"
                    color="text-green-600"
                    bg="bg-green-100"
                />
                {/* Placeholders for future features */}
                <StatsCard
                    title="Performance"
                    value="--"
                    icon={BarChart3}
                    description="Average Grade"
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
                <StatsCard
                    title="Upcoming"
                    value="0"
                    icon={Calendar}
                    description="Events"
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
            </div>

            {/* Navigation Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <NavLink href="/dashboard/classes" icon={BookOpen} title="All Classes" description="View school classes schedule" />
                        <NavLink href="/dashboard/students" icon={Users} title="All Students" description="View school student directory" />
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
