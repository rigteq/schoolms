"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, School, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudentDetailPagePage() {
    const { id } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [enrolledClass, setEnrolledClass] = useState<any>(null);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStudentDetails() {
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
                setStudent(data);

                // Fetch enrolled class
                const { data: enrollment } = await supabase
                    .from("students_data")
                    .select(`
             *,
             classes (id, class_name, academic_year)
           `)
                    .eq("student_id", id)
                    .maybeSingle(); // Student usually in one class per year, but schema allows many. Assuming single for current year view.

                if (enrollment?.classes) {
                    setEnrolledClass(enrollment.classes);

                    // Fetch teachers for this class
                    const { data: teachersData } = await supabase
                        .from("teachers_data")
                        .select(`
                   subject_name,
                   profiles (id, full_name, email)
                `)
                        .eq("class_id", enrollment.classes.id);

                    setTeachers(teachersData?.map((t: any) => ({ ...t.profiles, subject: t.subject_name })) || []);
                }

            } catch (error) {
                console.error("Error fetching student:", error);
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchStudentDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will soft delete the student.")) return;
        await supabase.from("profiles").update({ is_deleted: true }).eq("id", id);
        router.push("/dashboard/students");
    }

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!student) return <div>Student not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
            </Button>

            {/* Profile Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl font-bold">
                                {student.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{student.full_name}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                                    {student.schools?.school_name && (
                                        <span className="flex items-center gap-1"><School className="h-4 w-4" /> {student.schools.school_name}</span>
                                    )}
                                    {student.email && (
                                        <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {student.email}</span>
                                    )}
                                    {student.phone && (
                                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {student.phone}</span>
                                    )}
                                    {student.current_address && (
                                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {student.current_address}</span>
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

            <div className="grid gap-6 md:grid-cols-2">
                {/* Class Info */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Current Class</h2>
                    {enrolledClass ? (
                        <Card className="cursor-pointer hover:border-blue-500" onClick={() => router.push(`/dashboard/classes/${enrolledClass.id}`)}>
                            <CardHeader>
                                <CardTitle>{enrolledClass.class_name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{enrolledClass.academic_year}</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="p-8 border rounded-lg border-dashed text-center text-muted-foreground">
                            Not enrolled in any class.
                        </div>
                    )}
                </div>

                {/* Teachers Info */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Teachers</h2>
                    <Card>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {teachers.map((t) => (
                                    <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/dashboard/teachers/${t.id}`)}>
                                        <div>
                                            <p className="font-medium">{t.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{t.email}</p>
                                        </div>
                                        <Badge variant="outline">{t.subject || "Teacher"}</Badge>
                                    </div>
                                ))}
                                {teachers.length === 0 && <div className="p-4 text-center text-muted-foreground">No teachers found for current class.</div>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
