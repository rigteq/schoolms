"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Loader2, ArrowLeft, Plus, Eye, Edit, Trash2, FileText } from "lucide-react";
import TCForm from "@/components/dashboard/forms/TCForm";
import TCDownloadButton from "@/components/dashboard/tc/DownloadButton";
import { toast } from "sonner";

const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export default function StudentTCPage() {
    const { id } = useParams();
    const router = useRouter();
    const { role } = useAuth();

    // Access control: only Superadmin and Admin
    const canAccess = role === "Superadmin" || role === "Admin";

    const [student, setStudent] = useState<any>(null);
    const [tcList, setTcList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editTC, setEditTC] = useState<any>(null);
    const [deleteTC, setDeleteTC] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [studentRes, tcRes] = await Promise.all([
                supabase.from("students_data").select("*, schools(school_name), classes(class_name)").eq("id", id).single(),
                supabase.from("transfer_certificates").select("*, tc_academic_records(*), schools(school_name)").eq("student_id", id).eq("is_deleted", false).order("created_at", { ascending: false }),
            ]);
            if (studentRes.error) throw studentRes.error;
            setStudent(studentRes.data);
            setTcList(tcRes.data || []);
        } catch (err: any) {
            toast.error("Failed to load TC data");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleDelete = async () => {
        if (!deleteTC) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from("transfer_certificates").update({ is_deleted: true }).eq("id", deleteTC.id);
            if (error) throw error;
            toast.success("TC deleted.");
            setDeleteTC(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (!role) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;

    if (!canAccess) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <FileText className="h-16 w-16 text-slate-300" />
                <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
                <p className="text-slate-500">Transfer Certificates are only accessible to Super Admin and Admin.</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-indigo-500" /></div>;
    if (!student) return <div className="text-center py-20 text-slate-500">Student not found.</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/students/${id}`)}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text-primary tracking-tight">Transfer Certificates</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Student: <span className="font-medium text-slate-700">{student.full_name}</span>
                            {student.classes?.class_name && (
                                <Badge variant="outline" className="ml-2">{student.classes.class_name}</Badge>
                            )}
                        </p>
                    </div>
                </div>
                <Button
                    className="gradient-btn shrink-0"
                    onClick={() => router.push(`/dashboard/tc/new?studentId=${id}`)}
                >
                    <Plus className="h-4 w-4 mr-2" /> New TC
                </Button>
            </div>

            {/* TC List */}
            {tcList.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                    <CardContent className="py-16 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No Transfer Certificates yet</p>
                        <p className="text-slate-400 text-sm mt-1">Click "New TC" to create one for this student.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {tcList.map((tc) => (
                        <Card key={tc.id} className="border border-indigo-100 hover:border-indigo-200 transition-colors bg-white/80 backdrop-blur">
                            <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {tc.tc_file_no && (
                                                <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                                                    TC # {tc.tc_file_no}
                                                </Badge>
                                            )}
                                            {tc.scholar_register_no && (
                                                <Badge variant="outline" className="font-mono">SR # {tc.scholar_register_no}</Badge>
                                            )}
                                        </div>
                                        <p className="font-semibold text-slate-800">{tc.scholar_name}</p>
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            {tc.dated && <span>Dated: {formatDate(tc.dated)}</span>}
                                            {tc.admission_file_no && <span>Admission File: {tc.admission_file_no}</span>}
                                            <span>Created: {formatDate(tc.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <TCDownloadButton tc={tc} variant="outline" size="sm" className="gap-1 text-indigo-700" label="Download" />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-200 gap-1"
                                            onClick={() => { setEditTC(tc); setFormOpen(true); }}
                                        >
                                            <Edit className="h-3.5 w-3.5" /> Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 gap-1"
                                            onClick={() => setDeleteTC(tc)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditTC(null); } }}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="gradient-text-primary text-xl">
                            {editTC ? "Edit Transfer Certificate" : "Create Transfer Certificate"}
                        </DialogTitle>
                        <p className="text-slate-500 text-sm">Scholar's Register &amp; Transfer Certificate Form</p>
                    </DialogHeader>
                    <div className="py-2">
                        <TCForm
                            student={student}
                            tc={editTC}
                            onSuccess={() => {
                                setFormOpen(false);
                                setEditTC(null);
                                fetchData();
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTC} onOpenChange={(open) => { if (!open) setDeleteTC(null); }}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Delete Transfer Certificate?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            This will permanently remove TC <strong>{deleteTC?.tc_file_no || "this record"}</strong>. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
