"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveFullReportCardAction } from "@/app/actions/report-actions";
import { fetchSchoolsAction } from "@/app/actions/data-actions";
import { fetchStudentsForReportCardAction, fetchClassesForReportCardAction } from "@/app/actions/report-actions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { autoGrade, ReportCard, ReportCardSubject } from "@/lib/hooks/useReportCards";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────────────────
const TERMS = ["Term 1", "Term 2", "Final Exam"];

function getAcademicYears(): string[] {
    const current = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
        const y = current - 2 + i;
        return `${y}-${(y + 1).toString().slice(2)}`;
    });
}

interface SubjectRow {
    id?: string; // existing rows have id
    subject_name: string;
    max_marks: number;
    obtained_marks: string;
    grade: string;
    remarks: string;
}

interface FormData {
    student_id: string;
    class_id: string;
    academic_year: string;
    term: string;
    remarks: string;
    is_published: boolean;
}

interface ReportCardFormProps {
    /** Pass an existing report card to switch to edit mode */
    existingCard?: ReportCard;
    defaultSchoolId?: string;
    onSuccess?: (id: string) => void;
}

export default function ReportCardForm({
    existingCard,
    defaultSchoolId,
    onSuccess,
}: ReportCardFormProps) {
    const router = useRouter();
    const { profile, role } = useAuth();
    const schoolId = defaultSchoolId || profile?.school_id || "";
    const isEdit = !!existingCard;
    const canPublish = role === "Superadmin" || role === "Admin";

    // ── Students & Classes options ─────────────────────────────────────────
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<string>(schoolId || "");
    const [loadingOptions, setLoadingOptions] = useState(true);

    // ── Form state ─────────────────────────────────────────────────────────
    const [form, setForm] = useState<FormData>({
        student_id: existingCard?.student_id || "",
        class_id: existingCard?.class_id || "",
        academic_year: existingCard?.academic_year || getAcademicYears()[2],
        term: existingCard?.term || "Term 1",
        remarks: existingCard?.remarks || "",
        is_published: existingCard?.is_published || false,
    });

    const [subjects, setSubjects] = useState<SubjectRow[]>(
        existingCard?.report_card_subjects?.map((s: ReportCardSubject) => ({
            id: s.id,
            subject_name: s.subject_name,
            max_marks: s.max_marks,
            obtained_marks: s.obtained_marks?.toString() || "",
            grade: s.grade || "",
            remarks: s.remarks || "",
        })) || [{ subject_name: "", max_marks: 100, obtained_marks: "", grade: "", remarks: "" }]
    );

    const [saving, setSaving] = useState(false);

    // ── Load options ───────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLoadingOptions(true);
            try {
                // Determine which school we're working with
                const effectiveSchoolId = schoolId || selectedSchool;

                // If no school selected yet and user is Superadmin, load schools for selection
                if (!effectiveSchoolId && role === "Superadmin") {
                    const { data: schoolsData } = await fetchSchoolsAction(1, "", 1000);
                    setSchools(schoolsData || []);
                    setLoadingOptions(false);
                    return;
                }

                // If still no effective school ID, just finish loading
                if (!effectiveSchoolId) {
                    setLoadingOptions(false);
                    return;
                }

                // Now load students and classes for the selected school
                const [s, c] = await Promise.all([
                    fetchStudentsForReportCardAction(effectiveSchoolId),
                    fetchClassesForReportCardAction(effectiveSchoolId)
                ]);
                setStudents(s || []);
                setClasses(c || []);
                setLoadingOptions(false);
            } catch (err) {
                console.error("Error loading options:", err);
                setLoadingOptions(false);
            }
        })();
    }, [schoolId, selectedSchool, role]);

    // Auto-fill class when student is selected
    const handleStudentChange = (studentId: string) => {
        const s = students.find((x) => x.id === studentId);
        setForm((f) => ({ ...f, student_id: studentId, class_id: s?.class_id || f.class_id }));
    };

    // ── Subject helpers ────────────────────────────────────────────────────
    const addSubject = () =>
        setSubjects((prev) => [...prev, { subject_name: "", max_marks: 100, obtained_marks: "", grade: "", remarks: "" }]);

    const removeSubject = (idx: number) =>
        setSubjects((prev) => prev.filter((_, i) => i !== idx));

    const updateSubject = (idx: number, field: keyof SubjectRow, value: string | number) => {
        setSubjects((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            // Auto-grade whenever obtained or max changes
            if (field === "obtained_marks" || field === "max_marks") {
                const ob = field === "obtained_marks" ? Number(value) : Number(updated[idx].obtained_marks);
                const mx = field === "max_marks" ? Number(value) : updated[idx].max_marks;
                if (!isNaN(ob) && mx > 0) {
                    updated[idx].grade = autoGrade(ob, mx);
                }
            }
            return updated;
        });
    };

    // ── Save single card ───────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.student_id) { toast.error("Please select a student."); return; }
        if (!schoolId && !selectedSchool) { toast.error("Please select a school."); return; }
        if (subjects.some((s) => !s.subject_name.trim())) { toast.error("All subjects must have a name."); return; }

        const effectiveSchoolId = schoolId || selectedSchool;

        setSaving(true);
        try {
            let cardId = existingCard?.id;

            const payload = { ...form, school_id: effectiveSchoolId };
            
            const res = await saveFullReportCardAction(payload, subjects, profile?.id, isEdit, cardId);
            cardId = res.cardId;

            toast.success(isEdit ? "Report card updated!" : "Report card created!");
            if (onSuccess && cardId) onSuccess(cardId);
            else router.push(`/dashboard/report-cards/${cardId}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to save report card.");
        } finally {
            setSaving(false);
        }
    };



    if (loadingOptions) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* School Selector for Superadmin */}
            {!schoolId && role === "Superadmin" && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base gradient-text-primary">Select School</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>School</Label>
                            <Select value={selectedSchool} onValueChange={(v) => setSelectedSchool(v)}>
                                <SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    {schools.map((sch: any) => (
                                        <SelectItem key={sch.id} value={sch.id} className="cursor-pointer hover:bg-gray-100">
                                            {sch.school_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Term / Year / Published */}
            <Card className="border-indigo-100">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base gradient-text-primary">Report Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Academic Year</Label>
                        <Select value={form.academic_year} onValueChange={(v) => setForm((f) => ({ ...f, academic_year: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                            <SelectContent className="bg-white">
                                {getAcademicYears().map((y) => (
                                    <SelectItem key={y} value={y} className="cursor-pointer hover:bg-gray-100">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Term</Label>
                        <Select value={form.term} onValueChange={(v) => setForm((f) => ({ ...f, term: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                            <SelectContent className="bg-white">
                                {TERMS.map((t) => (
                                    <SelectItem key={t} value={t} className="cursor-pointer hover:bg-gray-100">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {canPublish && (
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={form.is_published ? "published" : "draft"}
                                onValueChange={(v) => setForm((f) => ({ ...f, is_published: v === "published" }))}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="draft" className="cursor-pointer hover:bg-gray-100">Draft</SelectItem>
                                    <SelectItem value="published" className="cursor-pointer hover:bg-gray-100">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Student Selector */}
            <Card className="border-indigo-100">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base gradient-text-primary">Select Student</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Student</Label>
                        <Select value={form.student_id} onValueChange={handleStudentChange} disabled={isEdit}>
                            <SelectTrigger><SelectValue placeholder="Search & select student" /></SelectTrigger>
                            <SelectContent className="bg-white max-h-64">
                                {students.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id} className="cursor-pointer hover:bg-gray-100">
                                        {s.full_name}
                                        {s.classes?.class_name && (
                                            <span className="ml-2 text-xs text-slate-400">({s.classes.class_name})</span>
                                        )}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={form.class_id} onValueChange={(v) => setForm((f) => ({ ...f, class_id: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select class (optional)" /></SelectTrigger>
                            <SelectContent className="bg-white">
                                {classes.map((c: any) => (
                                    <SelectItem key={c.id} value={c.id} className="cursor-pointer hover:bg-gray-100">
                                        {c.class_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Subjects Table */}
            <Card className="border-indigo-100">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base gradient-text-primary">Subjects & Marks</CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={addSubject} className="gap-1 border-indigo-200 text-indigo-600">
                        <Plus className="h-4 w-4" /> Add Subject
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Header row */}
                        <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase px-1">
                            <div className="col-span-3">Subject</div>
                            <div className="col-span-2">Max Marks</div>
                            <div className="col-span-2">Obtained</div>
                            <div className="col-span-1">Grade</div>
                            <div className="col-span-3">Remarks</div>
                            <div className="col-span-1"></div>
                        </div>

                        {subjects.map((subj, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="col-span-12 md:col-span-3">
                                    <Input
                                        placeholder="Subject name"
                                        value={subj.subject_name}
                                        onChange={(e) => updateSubject(idx, "subject_name", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={subj.max_marks}
                                        onChange={(e) => updateSubject(idx, "max_marks", e.target.value)}
                                        className="h-8 text-sm"
                                        min={1}
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Obtained"
                                        value={subj.obtained_marks}
                                        onChange={(e) => updateSubject(idx, "obtained_marks", e.target.value)}
                                        className="h-8 text-sm"
                                        min={0}
                                        max={subj.max_marks}
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-1">
                                    <div className={`h-8 rounded-md px-2 flex items-center justify-center text-sm font-bold border ${
                                        subj.grade === "A+" || subj.grade === "A" ? "bg-green-50 border-green-200 text-green-700" :
                                        subj.grade === "B+" || subj.grade === "B" ? "bg-blue-50 border-blue-200 text-blue-700" :
                                        subj.grade === "C" ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                                        subj.grade === "D" || subj.grade === "F" ? "bg-red-50 border-red-200 text-red-700" :
                                        "bg-slate-100 border-slate-200 text-slate-400"
                                    }`}>
                                        {subj.grade || "--"}
                                    </div>
                                </div>
                                <div className="col-span-7 md:col-span-3">
                                    <Input
                                        placeholder="Remarks (optional)"
                                        value={subj.remarks}
                                        onChange={(e) => updateSubject(idx, "remarks", e.target.value)}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSubject(idx)}
                                        disabled={subjects.length === 1}
                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals Summary */}
                    {subjects.some((s) => s.obtained_marks !== "") && (
                        <div className="mt-4 p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex flex-wrap gap-4 text-sm">
                            {(() => {
                                const totalMax = subjects.reduce((a, s) => a + Number(s.max_marks || 0), 0);
                                const totalOb = subjects.reduce((a, s) => a + Number(s.obtained_marks || 0), 0);
                                const pct = totalMax > 0 ? ((totalOb / totalMax) * 100).toFixed(1) : "0";
                                const overall = totalMax > 0 ? autoGrade(totalOb, totalMax) : "--";
                                return (
                                    <>
                                        <span className="text-slate-600">Total: <strong className="text-slate-800">{totalOb} / {totalMax}</strong></span>
                                        <span className="text-slate-600">Percentage: <strong className="text-indigo-600">{pct}%</strong></span>
                                        <span className="text-slate-600">Overall Grade: <strong className={`${overall === "A+" || overall === "A" ? "text-green-600" : overall === "F" ? "text-red-600" : "text-indigo-600"}`}>{overall}</strong></span>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Overall Remarks */}
            <Card className="border-indigo-100">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base gradient-text-primary">Overall Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                    <textarea
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        placeholder="Teacher's overall remarks about the student's performance..."
                        value={form.remarks}
                        onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                    />
                </CardContent>
            </Card>



            {/* Actions */}
            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()} className="border-indigo-100">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gradient-btn gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEdit ? "Save Changes" : "Create Report Card"}
                </Button>
            </div>
        </div>
    );
}
