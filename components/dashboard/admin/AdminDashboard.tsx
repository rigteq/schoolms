"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, BookOpen, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import AddProfileForm from "@/components/dashboard/forms/AddProfileForm";
import AddClassForm from "@/components/dashboard/forms/AddClassForm";

export default function AdminDashboard() {
    const { profile, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const schoolId = profile?.school_id;
    const schoolName = profile?.school_id ? "Your School" : "N/A";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
                    <p className="text-muted-foreground">Manage your school data and users.</p>
                </div>
            </div>

            {/* School Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle>School Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">School ID</p>
                            <p className="text-lg font-semibold">{schoolId || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="text-lg font-semibold">Administrator</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

            {/* Navigation Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Management Sections</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <NavLink href="/dashboard/teachers" icon={GraduationCap} title="Teachers" description="Manage all teachers" />
                        <NavLink href="/dashboard/students" icon={Users} title="Students" description="Manage all students" />
                        <NavLink href="/dashboard/classes" icon={BookOpen} title="Classes" description="Manage classes" />
                    </div>
                </CardContent>
            </Card>
        </div>
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
            <Card className="hover-card">
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
            <DialogContent>
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
