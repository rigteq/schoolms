"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Loader2 } from "lucide-react";

interface GlobalHoliday {
    id: string;
    leave_type: string;
    leave_date_from: string;
    leave_date_to: string;
    leave_comment: string;
    school_id: string;
}

export default function LeaveCalendarPage() {
    const { profile } = useAuth();
    const [holidays, setHolidays] = useState<GlobalHoliday[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHolidays = async () => {
            if (!profile?.school_id) return;

            try {
                const { data, error } = await supabase
                    .from("leave_details")
                    .select("*")
                    .eq("leave_type", "global")
                    .eq("school_id", profile.school_id)
                    .order("leave_date_from", { ascending: true });

                if (error) throw error;
                setHolidays(data || []);
            } catch (error) {
                console.error("Error fetching holidays:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHolidays();
    }, [profile]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
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
            <h2 className="text-3xl font-bold tracking-tight">School Holiday Calendar</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {holidays.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <CalendarDays className="h-12 w-12 mb-4 opacity-50" />
                        <p>No upcoming holidays found.</p>
                    </div>
                ) : (
                    holidays.map((holiday) => (
                        <Card key={holiday.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Global Holiday</CardTitle>
                                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{holiday.leave_comment || "Holiday"}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDate(holiday.leave_date_from)}
                                    {holiday.leave_date_from !== holiday.leave_date_to &&
                                        ` - ${formatDate(holiday.leave_date_to)}`}
                                </p>
                                <div className="mt-3">
                                    <Badge variant="secondary" className="text-xs">
                                        All School
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
