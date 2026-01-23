"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SchoolDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [school, setSchool] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Sub-lists data
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingLists, setLoadingLists] = useState(false);

    useEffect(() => {
        async function fetchSchoolDetails() {
            try {
                const { data, error } = await supabase
                    .from("schools")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setSchool(data);

                // Fetch related data
                setLoadingLists(true);
                const { data: classesData } = await supabase.from("classes").select("*").eq("school_id", id);
                const { data: teachersData } = await supabase.from("profiles").select("*").eq("school_id", id).eq("role_id", (await getRoleId('Teacher')));
                const { data: studentsData } = await supabase.from("profiles").select("*").eq("school_id", id).eq("role_id", (await getRoleId('Student')));

                setClasses(classesData || []);
                setTeachers(teachersData || []);
                setStudents(studentsData || []);
                setLoadingLists(false);

            } catch (error) {
                console.error("Error fetching school:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchSchoolDetails();
    }, [id]);

    async function getRoleId(roleName: string) {
        const { data } = await supabase.from("roles").select("id").eq("role_name", roleName).single();
        return data?.id;
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will soft delete the school.")) return;
        await supabase.from("schools").update({ is_deleted: true }).eq("id", id);
        router.push("/dashboard/schools");
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!school) return <div>School not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schools
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{school.school_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <span>{school.address}</span>
                        <span>•</span>
                        <span>{school.email}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                    <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{students.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teachers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classes.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="classes" className="w-full">
                <TabsList>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                    <TabsTrigger value="teachers">Teachers</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                </TabsList>
                <TabsContent value="classes" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium">Classes List</div>
                            <div className="divide-y">
                                {classes.map(cls => (
                                    <div key={cls.id} className="p-4 flex justify-between hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/classes/${cls.id}`)}>
                                        <div>
                                            <p className="font-medium">{cls.class_name}</p>
                                            <p className="text-sm text-muted-foreground">{cls.academic_year}</p>
                                        </div>
                                        <Badge variant={cls.is_deleted ? "destructive" : "secondary"}>{cls.is_deleted ? "Deleted" : "Active"}</Badge>
                                    </div>
                                ))}
                                {classes.length === 0 && <div className="p-4 text-center text-muted-foreground">No classes found</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="teachers" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium">Teachers List</div>
                            <div className="divide-y">
                                {teachers.map(t => (
                                    <div key={t.id} className="p-4 flex justify-between hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/teachers/${t.id}`)}>
                                        <div>
                                            <p className="font-medium">{t.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{t.email}</p>
                                        </div>
                                        <Badge variant="outline">Teacher</Badge>
                                    </div>
                                ))}
                                {teachers.length === 0 && <div className="p-4 text-center text-muted-foreground">No teachers found</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="students" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <div className="p-4 border-b font-medium">Students List</div>
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
                                {students.length === 0 && <div className="p-4 text-center text-muted-foreground">No students found</div>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
