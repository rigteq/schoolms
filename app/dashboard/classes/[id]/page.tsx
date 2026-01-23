"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Edit, Trash2, School, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClassDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [classData, setClassData] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        async function fetchClassDetails() {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("classes")
                    .select(`
             *,
             schools (school_name)
          `)
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setClassData(data);

                const { data: studentsEnrollments } = await supabase
                    .from("students_data")
                    .select(`
              student_id,
              profiles:student_id (id, full_name, email)
           `)
                    .eq("class_id", id);

                setStudents(studentsEnrollments?.map((s: any) => s.profiles) || []);

                const { data: teachersAssignments } = await supabase
                    .from("teachers_data")
                    .select(`
              teacher_id,
              subject_name,
              profiles:teacher_id (id, full_name, email)
           `)
                    .eq("class_id", id);

                setTeachers(teachersAssignments?.map((t: any) => ({ ...t.profiles, subject: t.subject_name })) || []);

            } catch (error) {
                console.error("Error fetching class:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchClassDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will soft delete the class.")) return;
        await supabase.from("classes").update({ is_deleted: true }).eq("id", id);
        router.push("/dashboard/classes");
    }

    if (!mounted) return null;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!classData) return <div>Class not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard/classes")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{classData.class_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><School className="h-4 w-4" /> {classData.schools?.school_name}</span>
                        <span>•</span>
                        <span>{classData.academic_year}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Class</Button>
                    <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Students Enrolled</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Teachers Assigned</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teachers.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-transparent">
                <Tabs defaultValue="students" className="w-full">
                    <TabsList className="bg-white shadow-sm rounded-lg p-1">
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="students" className="mt-4">
                        <Card>
                            <CardContent className="p-0">
                                <div className="p-4 border-b font-medium bg-gray-50/50">Class Roster</div>
                                <div className="divide-y">
                                    {students.map(s => (
                                        <div key={s.id} className="p-4 flex justify-between hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/students/${s.id}`)}>
                                            <div>
                                                <p className="font-medium">{s.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{s.email}</p>
                                            </div>
                                            <Badge variant="outline">Student</Badge>
                                        </div>
                                    ))}
                                    {students.length === 0 && <div className="p-4 text-center text-muted-foreground">No students enrolled.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="teachers" className="mt-4">
                        <Card>
                            <CardContent className="p-0">
                                <div className="p-4 border-b font-medium bg-gray-50/50">Teachers List</div>
                                <div className="divide-y">
                                    {teachers.map(t => (
                                        <div key={t.id} className="p-4 flex justify-between hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/teachers/${t.id}`)}>
                                            <div>
                                                <p className="font-medium">{t.full_name}</p>
                                                <p className="text-sm text-muted-foreground">{t.email}</p>
                                            </div>
                                            <Badge variant="secondary">{t.subject || "Teacher"}</Badge>
                                        </div>
                                    ))}
                                    {teachers.length === 0 && <div className="p-4 text-center text-muted-foreground">No teachers assigned.</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
