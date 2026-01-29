"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, UserPlus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function ClassDetailsPage() {
    const params = useParams();
    const classId = params.id as string;
    const { profile } = useAuth();

    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
    const [availableStudents, setAvailableStudents] = useState<any[]>([]);
    const [availableTeachers, setAvailableTeachers] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (classId) {
            fetchClassDetails();
        }
    }, [classId]);

    const fetchClassDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Class Info
            const { data: cls, error: clsError } = await supabase
                .from("classes")
                .select("*, schools(school_name)")
                .eq("id", classId)
                .single();

            if (clsError) throw clsError;
            setClassData(cls);

            // 2. Fetch Students in this class
            const { data: stud, error: studError } = await supabase
                .from("students_data")
                .select("*, profiles:id(full_name, email)")
                .eq("class_id", classId);

            if (studError) throw studError;
            setStudents(stud || []);

            // 3. Fetch Teachers (using distinct teachers_data filter requires array check)
            // Postgres array contains: class_ids @> {classId}
            const { data: teach, error: teachError } = await supabase
                .from("teachers_data")
                .select("*, profiles:id(full_name, email)")
                .contains("class_ids", [classId]);

            if (teachError) throw teachError;
            setTeachers(teach || []);

        } catch (error: any) {
            console.error(error);
            toast.error("Failed to load class details");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async (type: "student" | "teacher") => {
        if (!profile?.school_id) return;

        if (type === "student") {
            // Fetch students NOT in a class or just all students in school to move them?
            // Usually "Add Student" implies assigning a student who might be unassigned or moving them.
            // Let's fetch all students in school for simplicity of selection.
            const { data } = await supabase
                .from("profiles")
                .select("id, full_name, students_data!inner(class_id)") // Inner join to ensure they are students
                .eq("school_id", profile.school_id)
                .eq("roles.role_name", "Student"); // Assuming role link is standard, or check roles table. 
            // Better: query students_data -> profiles

            const { data: avail } = await supabase
                .from("students_data")
                .select("id, profiles:id(full_name, school_id)")
                .filter("profiles.school_id", "eq", profile.school_id); // This might be tricky with RLS if not set up for generic filter

            // Simpler: Fetch profiles with role Student in school
            // We need role ID for student
            const { data: roleData } = await supabase.from("roles").select("id").eq("role_name", "Student").single();
            if (roleData) {
                const { data: studs } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .eq("school_id", profile.school_id)
                    .eq("role_id", roleData.id);
                setAvailableStudents(studs || []);
            }

        } else {
            // Fetch teachers in school
            const { data: roleData } = await supabase.from("roles").select("id").eq("role_name", "Teacher").single();
            if (roleData) {
                const { data: teachs } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .eq("school_id", profile.school_id)
                    .eq("role_id", roleData.id);
                setAvailableTeachers(teachs || []);
            }
        }
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;
        setActionLoading(true);
        try {
            const { error } = await supabase
                .from("students_data")
                .update({ class_id: classId })
                .eq("id", selectedStudent);

            if (error) throw error;
            toast.success("Student added to class");
            setIsAddStudentOpen(false);
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
            // First get current class_ids
            const { data: current, error: fetchError } = await supabase
                .from("teachers_data")
                .select("class_ids")
                .eq("id", selectedTeacher)
                .single();

            if (fetchError) throw fetchError;

            const existingIds = current?.class_ids || [];
            if (existingIds.includes(classId)) {
                toast.error("Teacher is already assigned to this class");
                return;
            }

            const newIds = [...existingIds, classId];
            const { error: updateError } = await supabase
                .from("teachers_data")
                .update({ class_ids: newIds })
                .eq("id", selectedTeacher);

            if (updateError) throw updateError;

            toast.success("Teacher assigned to class");
            setIsAddTeacherOpen(false);
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm("Remove this student from the class?")) return;
        try {
            const { error } = await supabase
                .from("students_data")
                .update({ class_id: null })
                .eq("id", studentId);
            if (error) throw error;
            toast.success("Student removed");
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleRemoveTeacher = async (teacherId: string) => {
        if (!confirm("Remove this teacher from the class?")) return;
        try {
            const { data: current } = await supabase
                .from("teachers_data")
                .select("class_ids")
                .eq("id", teacherId)
                .single();

            const newIds = (current?.class_ids || []).filter((id: string) => id !== classId);

            const { error } = await supabase
                .from("teachers_data")
                .update({ class_ids: newIds })
                .eq("id", teacherId);
            if (error) throw error;
            toast.success("Teacher removed");
            fetchClassDetails();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="flex h-96 justify-center items-center"><Loader2 className="animate-spin" /></div>;
    if (!classData) return <div>Class not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{classData.class_name}</h2>
                    <p className="text-muted-foreground">{classData.schools?.school_name} • {classData.academic_year}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Teachers Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl">Teachers</CardTitle>
                        <Dialog open={isAddTeacherOpen} onOpenChange={(open) => {
                            setIsAddTeacherOpen(open);
                            if (open) fetchAvailableUsers('teacher');
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Teacher
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Assign Teacher to Class</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Select Teacher</Label>
                                        <Select onValueChange={setSelectedTeacher}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a teacher..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableTeachers.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
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
                    </CardHeader>
                    <CardContent>
                        {teachers.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No teachers assigned.</p>
                        ) : (
                            <div className="space-y-4">
                                {teachers.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <BookOpen className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{t.profiles?.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{t.subject_specialization || "General"}</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleRemoveTeacher(t.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Students Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl">Students ({students.length})</CardTitle>
                        <Dialog open={isAddStudentOpen} onOpenChange={(open) => {
                            setIsAddStudentOpen(open);
                            if (open) fetchAvailableUsers('student');
                        }}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="gap-2">
                                    <Plus className="h-4 w-4" /> Add Student
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Student to Class</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Select Student</Label>
                                        <Select onValueChange={setSelectedStudent}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a student..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableStudents.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
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
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">No students enrolled.</p>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {students.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                <UserPlus className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{s.profiles?.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{s.profiles?.email}</p>
                                            </div>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleRemoveStudent(s.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
