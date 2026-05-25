"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Loader2, Plus, FileText, Search, Eye } from "lucide-react";
import TCDownloadButton from "@/components/dashboard/tc/DownloadButton";
import { toast } from "sonner";

export default function TCManagementPage() {
    const router = useRouter();
    const { role, profile } = useAuth();

    // Access control: only Superadmin and Admin
    const canAccess = role === "Superadmin" || role === "Admin";

    const [tcList, setTcList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteTC, setDeleteTC] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        if (!profile?.school_id && role !== "Superadmin") return;
        setLoading(true);
        try {
            let query = supabase
                .from("transfer_certificates")
                .select("*, tc_academic_records(*), students_data(id, full_name, class_id, classes(class_name)), schools(school_name)")
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });
                
            if (role === "Admin" && profile?.school_id) {
                query = query.eq("school_id", profile.school_id);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            setTcList(data || []);
        } catch (err: any) {
            toast.error("Failed to load TC data");
        } finally {
            setLoading(false);
        }
    }, [profile?.school_id, role]);

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

    const filteredTcList = tcList.filter((tc) => {
        const studentName = tc?.students_data?.full_name || "";
        return studentName.toLowerCase().includes(search.toLowerCase());
    });

    const formatDate = (d: string | null) => {
        if (!d) return "—";
        return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const getYear = (tc: any) => {
        if (tc.dated) return new Date(tc.dated).getFullYear().toString();
        if (tc.created_at) return new Date(tc.created_at).getFullYear().toString();
        return "—";
    };

    const handleView = (tcId: string) => {
        router.push(`/dashboard/tc/${tcId}`);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text-primary tracking-tight flex items-center gap-3">
                        <FileText className="h-9 w-9 text-indigo-500" />
                        Transfer Certificates
                    </h1>
                    <p className="text-slate-600 mt-2">Manage and generate Transfer Certificates for students.</p>
                </div>
                <Button
                    className="gradient-btn shrink-0"
                    onClick={() => router.push("/dashboard/tc/new")}
                >
                    <Plus className="h-4 w-4 mr-2" /> New TC
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-indigo-400" />
                    <Input
                        placeholder="Search by student name..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* TC Table */}
            <Card className="border-indigo-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3 border-b border-indigo-100/30">
                    <CardTitle className="text-lg gradient-text-primary flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Transfer Certificates
                        <Badge variant="outline" className="ml-auto text-xs border-indigo-200 text-indigo-600">
                            {tcList.length} total
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {filteredTcList.length === 0 ? (
                        <div className="py-16 text-center text-slate-500 font-medium">
                            No Transfer Certificates found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-indigo-100 hover:bg-transparent">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Created At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTcList.map((tc) => (
                                    <TableRow
                                        key={tc.id}
                                        className="cursor-pointer border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                                        onClick={() => handleView(tc.id)}
                                    >
                                        <TableCell className="font-medium">
                                            {tc.students_data?.full_name || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                            {tc.students_data?.classes?.class_name || "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {getYear(tc)}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {formatDate(tc.created_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={(e) => { e.stopPropagation(); handleView(tc.id); }}
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <TCDownloadButton tc={tc} variant="ghost" size="icon" className="h-8 w-8 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50" label="" />
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

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
