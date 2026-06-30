"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditSchoolForm from "@/components/dashboard/forms/EditSchoolForm";
import { toast } from "sonner";

export default function SchoolDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [school, setSchool] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);

    const fetchSchoolDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("schools")
                .select("*")
                .eq("id", id)
                .eq("is_deleted", false)
                .single();

            if (error) throw error;
            setSchool(data);

            const [classesRes, rolesRes] = await Promise.all([
                supabase.from("classes").select("*").eq("school_id", id).eq("is_deleted", false),
                supabase.from("roles").select("id, role_name"),
            ]);

            const roles = rolesRes.data || [];
            const teacherRoleId = roles.find(r => r.role_name === "Teacher")?.id;
            const adminRoleId = roles.find(r => r.role_name === "Admin")?.id;

            const [teachersRes, studentsRes, adminsRes] = await Promise.all([
                supabase.from("profiles").select("*").eq("school_id", id).eq("role_id", teacherRoleId || "").eq("is_deleted", false),
                supabase.from("students_data").select("*").eq("school_id", id).eq("is_deleted", false),
                supabase.from("profiles").select("*").eq("school_id", id).eq("role_id", adminRoleId || "").eq("is_deleted", false),
            ]);

            setClasses(classesRes.data || []);
            setTeachers(teachersRes.data || []);
            setStudents(studentsRes.data || []);
            setAdmins(adminsRes.data || []);
        } catch {
            toast.error("Failed to load school details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSchoolDetails(); }, [id]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const { error } = await supabase
                .from("schools")
                .update({ is_deleted: true, modified_at: new Date().toISOString() })
                .eq("id", id);
            if (error) throw error;
            toast.success("School deleted successfully.");
            router.push("/dashboard/schools");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete school.");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
    if (!school) return <div className="text-center py-20 text-muted-foreground">School not found.</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard/schools")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schools
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text-primary">{school.school_name}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1 text-sm">
                        {school.address && <span>{school.address}</span>}
                        {school.address && school.email && <span>•</span>}
                        {school.email && <span>{school.email}</span>}
                        {school.phone && <><span>•</span><span>{school.phone}</span></>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50 text-indigo-700">
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                            <DialogHeader>
                                <DialogTitle className="gradient-text-primary">Edit School</DialogTitle>
                            </DialogHeader>
                            <div className="py-2">
                                <EditSchoolForm
                                    school={school}
                                    onSuccess={() => {
                                        setEditOpen(false);
                                        fetchSchoolDetails();
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={deleteLoading}>
                        {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete School?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{school.school_name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { label: "Total Admins", value: admins.length },
                    { label: "Total Teachers", value: teachers.length },
                    { label: "Total Students", value: students.length },
                    { label: "Total Classes", value: classes.length },
                ].map(({ label, value }) => (
                    <Card key={label} className="border-indigo-100 bg-white/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="classes" className="w-full">
                <TabsList className="bg-white shadow-sm rounded-lg p-1">
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>

                <TabsContent value="classes" className="mt-4">
                    <Card className="border-indigo-100">
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium bg-gray-50/50 text-slate-700">Classes List</div>
                            <div className="divide-y">
                                {classes.length === 0
                                    ? <div className="p-4 text-center text-muted-foreground">No classes found</div>
                                    : classes.map(cls => (
                                        <div key={cls.id} className="p-4 flex justify-between hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/classes/${cls.id}`)}>
                                            <div>
                                                <p className="font-medium">{cls.class_name}</p>
                                                <p className="text-sm text-muted-foreground">{cls.academic_year}</p>
                                            </div>
                                            <Badge variant="secondary">Active</Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="mt-4">
                    <Card className="border-indigo-100">
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium bg-gray-50/50 text-slate-700">Admins List</div>
                            <div className="divide-y">
                                {admins.length === 0
                                    ? <div className="p-4 text-center text-muted-foreground">No admins found</div>
                                    : admins.map(a => (
                                        <div key={a.id} className="p-4 flex justify-between hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium">{a.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{a.email}</p>
                                            </div>
                                            <Badge variant="outline">Admin</Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="teachers" className="mt-4">
                    <Card className="border-indigo-100">
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium bg-gray-50/50 text-slate-700">Teachers List</div>
                            <div className="divide-y">
                                {teachers.length === 0
                                    ? <div className="p-4 text-center text-muted-foreground">No teachers found</div>
                                    : teachers.map(t => (
                                        <div key={t.id} className="p-4 flex justify-between hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium">{t.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{t.email}</p>
                                            </div>
                                            <Badge variant="outline">Teacher</Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="mt-4">
                    <Card className="border-indigo-100">
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium bg-gray-50/50 text-slate-700">Students List</div>
                            <div className="divide-y">
                                {students.length === 0
                                    ? <div className="p-4 text-center text-muted-foreground">No students found</div>
                                    : students.map(s => (
                                        <div key={s.id} className="p-4 flex justify-between hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium">{s.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{s.email || "No email"}</p>
                                            </div>
                                            <Badge variant="outline">Student</Badge>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
