"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Edit, Trash2, FileText, Calendar, School, BookOpen } from "lucide-react";
import TCForm from "@/components/dashboard/forms/TCForm";
import TCDownloadButton from "@/components/dashboard/tc/DownloadButton";
import { toast } from "sonner";

const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getYear = (tc: any) => {
    if (tc.dated) return new Date(tc.dated).getFullYear().toString();
    if (tc.created_at) return new Date(tc.created_at).getFullYear().toString();
    return "—";
};

export default function TCDetailPage() {
    const { tcId } = useParams() as { tcId: string };
    const router = useRouter();
    const { role } = useAuth();
    const [tc, setTc] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const canManage = role === "Superadmin" || role === "Admin";

    const fetchTc = async () => {
        if (!tcId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("transfer_certificates")
                .select("*, tc_academic_records(*), students_data(id, full_name, class_id, classes(class_name)), schools(school_name)")
                .eq("id", tcId)
                .single();

            if (error) throw error;
            setTc(data);
        } catch (err: any) {
            toast.error("Failed to load TC.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTc(); }, [tcId]);

    const handleDelete = async () => {
        if (!tcId) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from("transfer_certificates").update({ is_deleted: true }).eq("id", tcId);
            if (error) throw error;
            toast.success("Transfer Certificate deleted.");
            router.push("/dashboard/tc");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete TC.");
        } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
        }
    };

    const handleDownload = () => {
        // handled by TCDownloadButton
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!tc) {
        return (
            <div className="text-center py-20 text-slate-500">
                Transfer Certificate not found.
                <br />
                <Button variant="link" onClick={() => router.push("/dashboard/tc")}>← Back to TC list</Button>
            </div>
        );
    }

    const student = tc.students_data;
    const className = student?.classes?.class_name || "—";

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/tc")} className="text-slate-600 hover:text-indigo-600 w-fit">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Transfer Certificates
                </Button>
                <div className="flex flex-wrap gap-2">
                    {canManage && !isEditing && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            <Edit className="h-4 w-4" /> Edit
                        </Button>
                    )}
                    <TCDownloadButton tc={tc} variant="outline" size="sm" label="Download PDF" className="gap-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50" />
                    {canManage && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setDeleteConfirmOpen(true)}
                                disabled={deleting}
                            >
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                                <AlertDialogContent className="bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-slate-900">Delete Transfer Certificate?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-600">
                                            This will permanently remove this transfer certificate. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                            Yes, Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-slate-600 hover:text-indigo-600">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Cancel Edit
                        </Button>
                        <h1 className="text-2xl font-bold gradient-text-primary">Edit Transfer Certificate</h1>
                    </div>
                    <TCForm
                        student={student}
                        tc={tc}
                        onSuccess={() => {
                            setIsEditing(false);
                            fetchTc();
                        }}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <Card className="border-indigo-100 overflow-hidden">
                        <CardHeader className="bg-indigo-50/60">
                            <CardTitle className="text-lg font-semibold text-slate-900">Transfer Certificate Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><School className="h-4 w-4" /> Student</div>
                                    <div className="font-semibold text-slate-900">{student?.full_name || "Unknown"}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><BookOpen className="h-4 w-4" /> Class</div>
                                    <div className="font-semibold text-slate-900">{className}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Calendar className="h-4 w-4" /> Year</div>
                                    <div className="font-semibold text-slate-900">{getYear(tc)}</div>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><FileText className="h-4 w-4" /> Created At</div>
                                    <div className="font-semibold text-slate-900">{formatDate(tc.created_at)}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200">
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">TC File No.</p>
                                    <p className="font-medium text-slate-800">{tc.tc_file_no || "—"}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Scholar Register No.</p>
                                    <p className="font-medium text-slate-800">{tc.scholar_register_no || "—"}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Date</p>
                                    <p className="font-medium text-slate-800">{formatDate(tc.dated)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-slate-500">Aadhar Number</p>
                                    <p className="font-medium text-slate-800">{tc.aadhar_number || "—"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
