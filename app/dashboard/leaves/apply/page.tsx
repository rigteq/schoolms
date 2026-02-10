"use client";

import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner is installed and configured
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ApplyLeavePage() {
    const { user, profile, role } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        leave_type: "",
        leave_date_from: "",
        leave_date_to: "",
        leave_comment: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value: string) => {
        setFormData({ ...formData, leave_type: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!profile?.school_id || !user?.id) {
                toast.error("User profile or school ID missing.");
                return;
            }

            if (!formData.leave_type || !formData.leave_date_from || !formData.leave_date_to) {
                toast.error("Please fill in all required fields.");
                return;
            }

            // Determine Status
            // Task says: "status by default approved, created_time,edited_time = default current_time" for Apply Leave form.
            // But wait, if a Teacher applies, it should probably be 'pending' unless said otherwise.
            // Prompt: "Apply leave - Create a form... (status by default approved...)" - THIS sounds like it applies to the Admin Dashboard task.
            // Task 3 (Teacher Dashboard) says "Apply leave" but doesn't explicitly repeat the "status by default approved" part, 
            // but implies similar functionality.
            // However, logic dictates: 
            // - Admins (approvers) applying -> Auto-approved.
            // - Teachers/Students -> Pending approval.
            // The prompt Task-2 says "(status by default approved)" under Admin dashboard section.
            // I will implement: Admin -> Approved, Teacher/Student -> Pending. 
            // The table has a CHECK constraint on status ('pending', 'approved', 'rejected') AND defaults to 'pending'.

            let status = 'pending';
            if (role === 'Admin' || role === 'Superadmin') {
                status = 'approved';
            }

            const payload = {
                profile_id: user.id,
                school_id: profile.school_id,
                leave_type: formData.leave_type,
                leave_date_from: formData.leave_date_from,
                leave_date_to: formData.leave_date_to,
                leave_comment: formData.leave_comment,
                status: status,
            };

            const { error } = await supabase.from("leave_details").insert(payload);

            if (error) throw error;

            toast.success("Leave application submitted successfully!");
            router.push("/dashboard/leaves/list");

        } catch (error: any) {
            console.error("Error submitting leave:", error);
            toast.error(error.message || "Failed to submit leave application.");
        } finally {
            setLoading(false);
        }
    };

    // Leave Types
    // Global is only for Admins.
    const leaveTypes = [
        { value: "lwp", label: "Leave Without Pay (LWP)" },
        { value: "sl", label: "Sick Leave (SL)" },
        { value: "cl", label: "Casual Leave (CL)" },
        { value: "el", label: "Earned Leave (EL)" },
    ];

    if (role === "Admin" || role === "Superadmin") {
        leaveTypes.unshift({ value: "global", label: "Global Holiday" });
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Apply for Leave</h2>
            </div>

            <div className="flex justify-center mt-8">
                <Card className="w-full max-w-2xl shadow-lg">
                    <CardHeader>
                        <CardTitle>Leave Application Form</CardTitle>
                        <CardDescription>
                            Submit your leave request. {role === "Admin" && "Admins can also create Global Holidays."}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="leave_type">Leave Type</Label>
                                <Select onValueChange={handleSelectChange} value={formData.leave_type}>
                                    <SelectTrigger id="leave_type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Types</SelectLabel>
                                            {leaveTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="leave_date_from">From Date</Label>
                                    <Input
                                        id="leave_date_from"
                                        name="leave_date_from"
                                        type="date"
                                        value={formData.leave_date_from}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="leave_date_to">To Date</Label>
                                    <Input
                                        id="leave_date_to"
                                        name="leave_date_to"
                                        type="date"
                                        value={formData.leave_date_to}
                                        onChange={handleChange}
                                        required
                                        min={formData.leave_date_from} // Ensure To date is after From date
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="leave_comment">Reason / Comment</Label>
                                <textarea
                                    id="leave_comment"
                                    name="leave_comment"
                                    className={cn(
                                        "flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    )}
                                    placeholder="Please describe the reason for your leave..."
                                    value={formData.leave_comment}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Application"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
