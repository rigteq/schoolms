"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, School, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TeacherDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [teacher, setTeacher] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        async function fetchTeacherDetails() {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select(`
             *,
             schools (school_name)
          `)
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setTeacher(data);

                const { data: classesData } = await supabase
                    .from("teachers_data")
                    .select(`
             subject_name,
             classes (id, class_name, academic_year)
           `)
                    .eq("id", id);

                setClasses(classesData?.map((item: any) => ({ ...item.classes, subject_name: item.subject_name })) || []);

            } catch (error) {
                console.error("Error fetching teacher:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchTeacherDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will soft delete the teacher.")) return;
        await supabase.from("profiles").update({ is_deleted: true }).eq("id", id);
        router.push("/dashboard/teachers");
    }

    if (!mounted) return null;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!teacher) return <div>Teacher not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard/teachers")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teachers
            </Button>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold">
                                {teacher.full_name?.charAt(0) || "T"}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{teacher.full_name}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                                    {teacher.schools?.school_name && (
                                        <span className="flex items-center gap-1"><School className="h-4 w-4" /> {teacher.schools.school_name}</span>
                                    )}
                                    {teacher.email && (
                                        <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {teacher.email}</span>
                                    )}
                                    {teacher.phone && (
                                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {teacher.phone}</span>
                                    )}
                                    {teacher.current_address && (
                                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {teacher.current_address}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                            <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <h2 className="text-xl font-semibold mt-8 mb-4">Classes Taught</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                    <Card key={cls.id} className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => router.push(`/dashboard/classes/${cls.id}`)}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg font-medium">{cls.class_name}</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{cls.academic_year}</p>
                            {cls.subject_name && <Badge variant="secondary" className="mt-2">{cls.subject_name}</Badge>}
                        </CardContent>
                    </Card>
                ))}
                {classes.length === 0 && (
                    <div className="col-span-full py-8 text-center text-muted-foreground border rounded-lg border-dashed">
                        Not assigned to any classes yet.
                    </div>
                )}
            </div>
        </div>
    );
}
