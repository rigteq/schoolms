"use client";

import { useAuth } from "@/context/AuthContext";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ReportCardForm from "@/components/dashboard/report-cards/ReportCardForm";

export default function NewReportCardPage() {
    const { profile, isLoading, role } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Only Auth users w/ role can create
    if (!role || role === "Student") {
        return (
            <div className="text-center py-20 text-slate-500">
                You do not have permission to create report cards.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/report-cards")}
                    className="text-slate-600 hover:text-indigo-600"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold gradient-text-primary tracking-tight flex items-center gap-2">
                        <PlusCircle className="h-7 w-7 text-indigo-500" />
                        New Report Card
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Create a report card for a single student.
                    </p>
                </div>
            </div>

            <ReportCardForm defaultSchoolId={profile?.school_id} />
        </div>
    );
}
