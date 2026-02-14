"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface LeaveApplication {
    id: string;
    profile_id: string;
    leave_type: string;
    leave_date_from: string;
    leave_date_to: string;
    leave_comment: string;
    status: "pending" | "approved" | "rejected";
    created_time: string;
    profiles: {
        full_name: string;
    };
}

export default function LeaveApplicationList() {
    const { user, profile, role } = useAuth();
    const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaves = async () => {
        try {
            if (!profile?.school_id) return;

            let query = supabase
                .from("leave_details")
                .select("*, profiles(full_name)")
                .neq("leave_type", "global") // Exclude global holidays
                .order("created_time", { ascending: false });

            if (role === "Admin" || role === "Superadmin") {
                // Admin sees all in school
                query = query.eq("school_id", profile.school_id);
            } else {
                // Teachers/Students see only their own
                query = query.eq("profile_id", user?.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setLeaves(data || []);
        } catch (error: any) {
            console.error("Error fetching leaves:", error);
            toast.error("Failed to load leave applications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, [user, profile, role]);

    const handleStatusUpdate = async (id: string, newStatus: "approved" | "rejected") => {
        try {
            const { error } = await supabase
                .from("leave_details")
                .update({ status: newStatus, edited_time: new Date().toISOString() })
                .eq("id", id);

            if (error) throw error;

            toast.success(`Leave ${newStatus} successfully.`);
            // Optimistic update
            setLeaves((prev) =>
                prev.map((leave) =>
                    leave.id === id ? { ...leave, status: newStatus } : leave
                )
            );
        } catch (error: any) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status.");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return <Badge variant="success">Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="warning">Pending</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-4xl font-bold gradient-text-primary tracking-tight">Leave Applications</h2>
            </div>

            <div className="rounded-xl border-2 border-indigo-100 bg-white/80 backdrop-blur shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {(role === "Admin" || role === "Superadmin") && <TableHead>Applicant</TableHead>}
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaves.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No leave applications found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            leaves.map((leave) => (
                                <TableRow key={leave.id}>
                                    {(role === "Admin" || role === "Superadmin") && (
                                        <TableCell className="font-medium">
                                            {leave.profiles?.full_name || "Unknown"}
                                        </TableCell>
                                    )}
                                    <TableCell className="uppercase">{leave.leave_type}</TableCell>
                                    <TableCell>{formatDate(leave.leave_date_from)}</TableCell>
                                    <TableCell>{formatDate(leave.leave_date_to)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={leave.leave_comment}>
                                        {leave.leave_comment || "-"}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                    <TableCell className="text-right">
                                        {(role === "Admin" || role === "Superadmin") &&
                                            leave.status === "pending" &&
                                            leave.profile_id !== user?.id && ( // Cannot approve own leave if admin applies? Actually admin leaves are auto-approved, but just in case.
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleStatusUpdate(leave.id, "approved")}
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleStatusUpdate(leave.id, "rejected")}
                                                        title="Reject"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
