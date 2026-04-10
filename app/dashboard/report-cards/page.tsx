"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, FileText } from "lucide-react";
import ReportCardList from "@/components/dashboard/report-cards/ReportCardList";

export default function ReportCardsPage() {
    const { profile, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text-primary tracking-tight flex items-center gap-3">
                        <FileText className="h-9 w-9 text-indigo-500" />
                        Report Cards
                    </h1>
                    <p className="text-slate-600 mt-2">
                        {role === "Superadmin"
                            ? "Manage report cards across all schools."
                            : "Create, manage and download student report cards."}
                    </p>
                </div>
            </div>

            <ReportCardList defaultSchoolId={profile?.school_id} />
        </div>
    );
}
