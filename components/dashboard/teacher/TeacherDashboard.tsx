"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart3, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TeacherDashboard() {
    const { profile, isLoading: authLoading } = useAuth();
    const [stats, setStats] = useState({ classes: 0, students: 0 });
    const [schoolName, setSchoolName] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!profile?.id || !profile?.school_id) return;

            try {
                // Fetch school name and teacher data in parallel
                const [schoolRes, teacherRes] = await Promise.all([
                    fetch(`/api/schools/${profile.school_id}`),
                    fetch(`/api/teachers/${profile.id}`),
                ]);

                const schoolData = schoolRes.ok ? await schoolRes.json() : null;
                const teacherData = teacherRes.ok ? await teacherRes.json() : null;

                if (schoolData?.school?.school_name) setSchoolName(schoolData.school.school_name);

                const myClasses = teacherData?.classes || [];
                const classCount = myClasses.length;

                let studentCount = 0;
                if (classCount > 0) {
                    // Sum up students across all classes
                    const classIds = myClasses.map((c: any) => c.id);
                    const studentRes = await fetch(`/api/students?school_id=${profile.school_id}&limit=1000`);
                    if (studentRes.ok) {
                        const studentData = await studentRes.json();
                        studentCount = (studentData.data || []).filter((s: any) => classIds.includes(s.class_id)).length;
                    }
                }

                setStats({ classes: classCount, students: studentCount });
            } catch (error) {
                console.error("Error fetching teacher stats:", error);
            } finally {
                setLoading(false);
            }
        };

        if (profile) fetchStats();
        else if (!authLoading) setLoading(false);
    }, [profile, authLoading]);

    if (authLoading || loading) {
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
                    <h2 className="text-4xl font-bold gradient-text-primary tracking-tight">Teacher Dashboard</h2>
                    <p className="text-slate-600 mt-2">
                        {schoolName
                            ? <>Welcome to <strong>{schoolName}</strong>. Manage your assigned classes and students.</>
                            : "Manage your assigned classes and students."
                        }
                    </p>
                </div>
            </div>

            {/* Teacher Info Card */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="gradient-text-primary">Welcome back, {profile?.full_name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <p className="text-sm text-muted-foreground">School</p>
                            <p className="text-lg font-semibold">{schoolName || "—"}</p>
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
                <StatsCard title="My Classes" value={stats.classes} icon={BookOpen} description="Assigned classes" color="text-blue-600" bg="bg-blue-100" />
                <StatsCard title="My Students" value={stats.students} icon={Users} description="In your classes" color="text-green-600" bg="bg-green-100" />
                <StatsCard title="Performance" value="--" icon={BarChart3} description="Average Grade" color="text-purple-600" bg="bg-purple-100" />
                <StatsCard title="Upcoming" value="0" icon={Calendar} description="Events" color="text-orange-600" bg="bg-orange-100" />
            </div>

            {/* Navigation Links */}
            <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader>
                    <CardTitle className="gradient-text-primary">Quick Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <NavLink href="/dashboard/classes" icon={BookOpen} title="My Classes" description="View your assigned classes" />
                        <NavLink href="/dashboard/students" icon={Users} title="Students" description="View students in your classes" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, description, color, bg }: any) {
    return (
        <Card className="hover-card border-indigo-100 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">{title}</CardTitle>
                <div className={`${bg} p-2 rounded-full`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
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
        <Link href={href} className="block p-4 border border-indigo-100 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 text-indigo-600" />
                <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </Link>
    );
}
