"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReportCard, autoGrade, ReportCardSubject } from "@/lib/hooks/useReportCards";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Loader2, ArrowLeft, Edit, Trash2,
    FileText, User, BookOpen, Calendar,
    CheckCircle2, Clock, School
} from "lucide-react";
import DownloadButton from "@/components/dashboard/report-cards/DownloadButton";
import ReportCardForm from "@/components/dashboard/report-cards/ReportCardForm";
import { toast } from "sonner";

const GRADE_COLORS: Record<string, string> = {
    "A+": "bg-green-100 text-green-700 border-green-200",
    "A": "bg-green-50 text-green-600 border-green-100",
    "B+": "bg-blue-100 text-blue-700 border-blue-200",
    "B": "bg-blue-50 text-blue-600 border-blue-100",
    "C": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "D": "bg-orange-50 text-orange-700 border-orange-200",
    "F": "bg-red-100 text-red-700 border-red-200",
};

export default function ReportCardDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { role, profile } = useAuth();
    const { reportCard, loading, mutate } = useReportCard(id);
    const [isEditing, setIsEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [publishing, setPublishing] = useState(false);

    const canManage = role === "Superadmin" || role === "Admin";
    const canEdit = role === "Superadmin" || role === "Admin" || role === "Teacher";
    const canDelete = role === "Superadmin" || role === "Admin";

    const handleDelete = async () => {
        if (!confirm("Delete this report card? This action cannot be undone.")) return;
        setDeleting(true);
        const { error } = await supabase
            .from("report_cards")
            .update({ is_deleted: true })
            .eq("id", id);
        if (error) {
            toast.error("Failed to delete: " + error.message);
            setDeleting(false);
        } else {
            toast.success("Report card deleted.");
            router.push("/dashboard/report-cards");
        }
    };

    const handleTogglePublish = async () => {
        if (!reportCard) return;
        setPublishing(true);
        const newStatus = !reportCard.is_published;
        const { error } = await supabase
            .from("report_cards")
            .update({ is_published: newStatus, modified_at: new Date().toISOString() })
            .eq("id", id);
        if (error) {
            toast.error("Failed to update status.");
        } else {
            toast.success(newStatus ? "Report card published!" : "Moved back to draft.");
            mutate();
        }
        setPublishing(false);
    };

    // ── Loading / Not Found ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!reportCard) {
        return (
            <div className="text-center py-20 text-slate-500">
                Report card not found.
                <br />
                <Button variant="link" onClick={() => router.push("/dashboard/report-cards")}>
                    ← Back to list
                </Button>
            </div>
        );
    }

    // Build computed data
    const subjects = reportCard.report_card_subjects || [];
    const totalMax = subjects.reduce((a: number, s: ReportCardSubject) => a + s.max_marks, 0);
    const totalOb = subjects.reduce((a: number, s: ReportCardSubject) => a + (s.obtained_marks ?? 0), 0);
    const overallPct = totalMax > 0 ? ((totalOb / totalMax) * 100).toFixed(1) : "0";
    const overallGrade = totalMax > 0 ? autoGrade(totalOb, totalMax) : "—";
    const student = reportCard.students_data as any;
    const school = reportCard.schools as any;
    const cls = reportCard.classes as any;

    // ── Edit Mode ──────────────────────────────────────────────────────────
    if (isEditing) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-slate-600 hover:text-indigo-600">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Cancel Edit
                    </Button>
                    <h1 className="text-2xl font-bold gradient-text-primary">Edit Report Card</h1>
                </div>
                <ReportCardForm
                    existingCard={reportCard}
                    defaultSchoolId={reportCard.school_id}
                    onSuccess={() => { setIsEditing(false); mutate(); }}
                />
            </div>
        );
    }

    // ── View Mode ──────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Back + Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/report-cards")}
                    className="text-slate-600 hover:text-indigo-600 w-fit"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Report Cards
                </Button>
                <div className="flex flex-wrap gap-2">
                    {canManage && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTogglePublish}
                            disabled={publishing}
                            className={`gap-2 border-indigo-200 ${reportCard.is_published ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                        >
                            {publishing
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : reportCard.is_published
                                    ? <Clock className="h-4 w-4" />
                                    : <CheckCircle2 className="h-4 w-4" />
                            }
                            {reportCard.is_published ? "Unpublish" : "Publish"}
                        </Button>
                    )}
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            <Edit className="h-4 w-4" /> Edit
                        </Button>
                    )}
                    <DownloadButton reportCard={reportCard} size="sm" label="Download PDF" />
                    {canDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Header Card — School Brand */}
            <Card className="border-indigo-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-5 text-white">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <div className="flex items-center gap-2 mb-1 opacity-80 text-sm">
                                <School className="h-4 w-4" />
                                {school?.school_name || "School"}
                            </div>
                            <h2 className="text-2xl font-bold">Student Report Card</h2>
                            <p className="text-white/80 text-sm mt-0.5">
                                {reportCard.academic_year} · {reportCard.term}
                            </p>
                        </div>
                        <Badge
                            className={`text-sm px-3 py-1 ${reportCard.is_published
                                ? "bg-green-400/30 text-white border-green-300"
                                : "bg-white/20 text-white/80 border-white/30"
                            }`}
                            variant="outline"
                        >
                            {reportCard.is_published ? "✓ Published" : "Draft"}
                        </Badge>
                    </div>
                </div>

                <CardContent className="pt-0">
                    {/* Student Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-indigo-50/50 border-b border-indigo-100">
                        <InfoCell icon={<User className="h-4 w-4" />} label="Student" value={student?.full_name || "N/A"} />
                        <InfoCell icon={<BookOpen className="h-4 w-4" />} label="Class" value={cls?.class_name || "N/A"} />
                        <InfoCell icon={<Calendar className="h-4 w-4" />} label="Year" value={reportCard.academic_year} />
                        <InfoCell icon={<FileText className="h-4 w-4" />} label="Term" value={reportCard.term} />
                    </div>
                </CardContent>
            </Card>

            {/* Overall Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard label="Total Marks" value={`${totalOb} / ${totalMax}`} color="from-indigo-500 to-purple-500" />
                <SummaryCard label="Percentage" value={`${overallPct}%`} color="from-cyan-500 to-blue-500" />
                <SummaryCard label="Overall Grade" value={overallGrade} color={
                    overallGrade === "A+" || overallGrade === "A" ? "from-green-500 to-emerald-500" :
                    overallGrade === "F" ? "from-red-500 to-rose-500" :
                    "from-orange-500 to-amber-500"
                } />
                <SummaryCard label="Subjects" value={subjects.length.toString()} color="from-slate-500 to-slate-600" />
            </div>

            {/* Subjects Table */}
            <Card className="border-indigo-100">
                <CardHeader className="pb-3">
                    <CardTitle className="gradient-text-primary text-base">Subject-wise Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-indigo-100 hover:bg-transparent">
                                <TableHead>Subject</TableHead>
                                <TableHead className="text-center">Max Marks</TableHead>
                                <TableHead className="text-center">Obtained</TableHead>
                                <TableHead className="text-center">Percentage</TableHead>
                                <TableHead className="text-center">Grade</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.map((s: ReportCardSubject) => {
                                const ob = s.obtained_marks ?? 0;
                                const grade = s.grade || autoGrade(ob, s.max_marks);
                                const pct = s.max_marks > 0 ? ((ob / s.max_marks) * 100).toFixed(1) : "0";
                                return (
                                    <TableRow key={s.id} className="border-b border-gray-50 hover:bg-indigo-50/20">
                                        <TableCell className="font-medium">{s.subject_name}</TableCell>
                                        <TableCell className="text-center text-slate-600">{s.max_marks}</TableCell>
                                        <TableCell className="text-center font-semibold text-slate-800">{ob}</TableCell>
                                        <TableCell className="text-center text-slate-600">{pct}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={`font-bold ${GRADE_COLORS[grade] || "bg-slate-50 text-slate-500 border-slate-200"}`}
                                            >
                                                {grade}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {s.remarks || "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {/* Total Row */}
                            <TableRow className="bg-indigo-50/50 font-semibold border-t-2 border-indigo-100 hover:bg-indigo-50/70">
                                <TableCell className="text-indigo-700">TOTAL</TableCell>
                                <TableCell className="text-center text-indigo-600">{totalMax}</TableCell>
                                <TableCell className="text-center text-indigo-700">{totalOb}</TableCell>
                                <TableCell className="text-center text-indigo-600">{overallPct}%</TableCell>
                                <TableCell className="text-center">
                                    <Badge
                                        variant="outline"
                                        className={`font-bold ${GRADE_COLORS[overallGrade] || "bg-indigo-50 text-indigo-600 border-indigo-200"}`}
                                    >
                                        {overallGrade}
                                    </Badge>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Remarks */}
            {reportCard.remarks && (
                <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm gradient-text-primary">Teacher&apos;s Remarks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-700 text-sm leading-relaxed">{reportCard.remarks}</p>
                    </CardContent>
                </Card>
            )}

            {/* Bottom Download CTA */}
            <div className="flex justify-center pb-4">
                <DownloadButton reportCard={reportCard} size="lg" label="Download PDF Report Card" />
            </div>
        </div>
    );
}

// ── Small helpers ──────────────────────────────────────────────────────────

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                {icon} {label}
            </div>
            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
        </div>
    );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <Card className="border-indigo-100 overflow-hidden hover-card">
            <CardContent className="p-0">
                <div className={`h-1 bg-gradient-to-r ${color}`} />
                <div className="p-4">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}
