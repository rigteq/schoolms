"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchClassDetailsAction, fetchAvailableStudentsAction, fetchAvailableTeachersAction } from "@/app/actions/data-actions";
import { deleteRecordAction, updateStudentAction, assignTeacherToClassAction, removeTeacherFromClassAction } from "@/app/actions/mutations";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, UserPlus, BookOpen, ArrowLeft, Edit } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import EditClassForm from "@/components/dashboard/forms/EditClassForm";

export default function ClassDetailsPage() {
    const params = useParams();
    const classId = params.id as string;
    const router = useRouter();
    const { profile, role } = useAuth();

    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Confirmation dialogs
    const [deleteClassOpen, setDeleteClassOpen] = useState(false);
    const [removeStudentTarget, setRemoveStudentTarget] = useState<{ id: string; name: string } | null>(null);
    const [removeTeacherTarget, setRemoveTeacherTarget] = useState<{ id: string; name: string } | null>(null);

    // Modal States
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const canManage = role === "Admin" || role === "Superadmin";

    useEffect(() => {
        if (classId) fetchClassDetails();
    }, [classId]);

    const fetchClassDetails = async () => {
        setLoading(true);
        try {
            const data = await fetchClassDetailsAction(classId);
            if (!data) throw new Error("Class not found");
            
            setClassData(data.cls);
            setStudents(data.students || []);
            setTeachers(data.teachers || []);
        } catch (error: any) {
            toast.error("Failed to load class details");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async (type: "student" | "teacher") => {
        const targetSchoolId = classData?.school_id || profile?.school_id;
        if (!targetSchoolId) return;

        if (type === "student") {
            const studs = await fetchAvailableStudentsAction(targetSchoolId);
            setAvailableStudents(studs || []);
        } else {
            const teachs = await fetchAvailableTeachersAction(targetSchoolId);
            setAvailableTeachers(teachs || []);
        }
    };

    const handleDeleteClass = async () => {
        setDeleteLoading(true);
        try {
            await deleteRecordAction("classes", classId);
            toast.success("Class deleted successfully.");
            router.push("/dashboard/classes");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete class.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;
        setActionLoading(true);
        try {
            const { error } = await updateStudentAction(selectedStudent, { class_id: classId });
            if (error) throw new Error(error || "Failed to add student");
            toast.success("Student added to class");
            setIsAddStudentOpen(false);
            setSelectedStudent("");
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddTeacher = async () => {
        if (!selectedTeacher) return;
        setActionLoading(true);
        try {
            const isFirst = !classData.profiles?.id;
            await assignTeacherToClassAction(selectedTeacher, classId, isFirst);

            toast.success("Teacher assigned to class");
            setIsAddTeacherOpen(false);
            setSelectedTeacher("");
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        try {
            const { error } = await updateStudentAction(studentId, { class_id: null });
            if (error) throw new Error(error || "Failed to remove student");
            toast.success("Student removed from class");
            setRemoveStudentTarget(null);
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleRemoveTeacher = async (teacherId: string) => {
        try {
            const isClassTeacher = classData.profiles?.id === teacherId;
            await removeTeacherFromClassAction(teacherId, classId, isClassTeacher);

            toast.success("Teacher removed from class");
            setRemoveTeacherTarget(null);
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    if (!classData) return <div className="text-center py-20 text-muted-foreground">Class not found.</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard/classes")} className="mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
            </Button>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold gradient-text-primary tracking-tight">{classData.class_name}</h2>
                    <p className="text-slate-600 mt-1">
                        {classData.schools?.school_name && <span>{classData.schools.school_name} • </span>}
                        {classData.academic_year}
                        {classData.profiles?.full_name && (
                            <span> • Class Teacher: <strong>{classData.profiles.full_name}</strong></span>
                        )}
                    </p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        {/* Edit Dialog */}
                        <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-indigo-200 hover:bg-indigo-50 text-indigo-700">
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white">
                                <DialogHeader>
                                    <DialogTitle className="gradient-text-primary">Edit Class</DialogTitle>
                                </DialogHeader>
                                <div className="py-2">
                                    <EditClassForm
                                        cls={classData}
                                        onSuccess={() => { setEditOpen(false); fetchClassDetails(); }}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button
                            variant="destructive"
                            onClick={() => setDeleteClassOpen(true)}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete Class
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete Class Confirmation */}
            <AlertDialog open={deleteClassOpen} onOpenChange={setDeleteClassOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{classData.class_name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClass} className="bg-red-600 hover:bg-red-700 text-white">
                            Yes, Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Student Confirmation */}
            <AlertDialog open={!!removeStudentTarget} onOpenChange={(open) => { if (!open) setRemoveStudentTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Student?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove <strong>{removeStudentTarget?.name}</strong> from this class? They will become unassigned.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => removeStudentTarget && handleRemoveStudent(removeStudentTarget.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remove Teacher Confirmation */}
            <AlertDialog open={!!removeTeacherTarget} onOpenChange={(open) => { if (!open) setRemoveTeacherTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Remove <strong>{removeTeacherTarget?.name}</strong> from this class?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => removeTeacherTarget && handleRemoveTeacher(removeTeacherTarget.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Yes, Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Teachers Section */}
                <Card className="border-indigo-100 bg-white/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl gradient-text-primary">Teachers</CardTitle>
                        {canManage && (
                            <Dialog open={isAddTeacherOpen} onOpenChange={(open) => {
                                setIsAddTeacherOpen(open);
                                if (open) fetchAvailableUsers('teacher');
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                        <Plus className="h-4 w-4" /> Add Teacher
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white">
                                    <DialogHeader>
                                        <DialogTitle>Assign Teacher to Class</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Select Teacher</Label>
                                            <Select onValueChange={setSelectedTeacher} value={selectedTeacher}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a teacher..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {availableTeachers.map(t => (
                                                        <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">{t.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleAddTeacher} disabled={actionLoading} className="w-full">
                                            {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Assign Teacher"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        {teachers.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No teachers assigned.</p>
                        ) : (
                            <div className="space-y-3">
                                {teachers.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between border border-indigo-100 p-3 rounded-lg hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{t.profiles?.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{t.subject_specialization || "General"}</p>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <Button
                                                size="icon" variant="ghost"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setRemoveTeacherTarget({ id: t.id, name: t.profiles?.full_name || "Teacher" })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Students Section */}
                <Card className="border-indigo-100 bg-white/80">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl gradient-text-primary">Students ({students.length})</CardTitle>
                        {canManage && (
                            <Dialog open={isAddStudentOpen} onOpenChange={(open) => {
                                setIsAddStudentOpen(open);
                                if (open) fetchAvailableUsers('student');
                            }}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                        <Plus className="h-4 w-4" /> Add Student
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white">
                                    <DialogHeader>
                                        <DialogTitle>Add Student to Class</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Select Student</Label>
                                            <Select onValueChange={setSelectedStudent} value={selectedStudent}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a student..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {availableStudents.map(s => (
                                                        <SelectItem key={s.id} value={s.id} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">{s.full_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleAddStudent} disabled={actionLoading} className="w-full">
                                            {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Add Student"}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No students enrolled.</p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {students.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between border border-indigo-100 p-3 rounded-lg hover:bg-indigo-50/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <UserPlus className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{s.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{s.email || "No email"}</p>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <Button
                                                size="icon" variant="ghost"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setRemoveStudentTarget({ id: s.id, name: s.full_name })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
