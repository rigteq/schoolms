"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import SuperAdminDashboard from "@/components/dashboard/superadmin/SuperAdminDashboard";
// import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
// import TeacherDashboard from "@/components/dashboard/teacher/TeacherDashboard";
// import StudentDashboard from "@/components/dashboard/student/StudentDashboard";

export default function DashboardPage() {
    const { role, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-lg font-medium text-muted-foreground">Loading your dashboard...</span>
            </div>
        );
    }

    /* Logic Gate */
    if (role === "Superadmin") {
        return <SuperAdminDashboard />;
    }

    if (role === "Admin") {
        return <div>Admin Dashboard (Coming Soon)</div>; // <AdminDashboard />;
    }

    if (role === "Teacher") {
        return <div>Teacher Dashboard (Coming Soon)</div>; // <TeacherDashboard />;
    }

    if (role === "Student") {
        return <div>Student Dashboard (Coming Soon)</div>; // <StudentDashboard />;
    }

    return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Access Denied or Unknown Role</h2>
            <p>Please contact support if you believe this is an error.</p>
        </div>
    );
}
