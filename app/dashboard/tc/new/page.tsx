"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import TCForm from "@/components/dashboard/forms/TCForm";
import { toast } from "sonner";

export default function NewTCPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile, role, isLoading } = useAuth();
    const queryStudentId = searchParams.get("studentId") || "";

    const [selectedSchool, setSelectedSchool] = useState<string>(profile?.school_id || "");
    const [schools, setSchools] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [selectedStudentId, setSelectedStudentId] = useState<string>(queryStudentId);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const canAccess = role === "Superadmin" || role === "Admin";
    const effectiveSchoolId = selectedSchool || profile?.school_id || "";

    useEffect(() => {
        if (isLoading) return;
        if (!canAccess) return;

        async function loadOptions() {
            setLoading(true);
            try {
                let currentSchoolId = effectiveSchoolId;

                if (!currentSchoolId && role === "Superadmin") {
                    const { data: schoolData, error: schoolError } = await supabase
                        .from("schools")
                        .select("id, school_name")
                        .eq("is_deleted", false)
                        .order("school_name");
                    if (schoolError) throw schoolError;
                    setSchools(schoolData || []);
                }

                if (queryStudentId) {
                    const { data: studentData, error: studentError } = await supabase
                        .from("students_data")
                        .select("id, full_name, class_id, school_id, current_address, father_name, mother_name, dob")
                        .eq("id", queryStudentId)
                        .single();
                    if (studentError) throw studentError;
                    setSelectedStudent(studentData);
                    setSelectedStudentId(studentData.id);
                    setSelectedClassId(studentData.class_id || "");
                    if (role === "Superadmin" && studentData.school_id) {
                        setSelectedSchool(studentData.school_id);
                    }
                    currentSchoolId = studentData.school_id || currentSchoolId;
                }

                if (currentSchoolId) {
                    const [{ data: classData, error: classError }, { data: studentData, error: studentError }] = await Promise.all([
                        supabase
                            .from("classes")
                            .select("id, class_name")
                            .eq("school_id", currentSchoolId)
                            .eq("is_deleted", false)
                            .order("class_name"),
                        supabase
                            .from("students_data")
                            .select("id, full_name, class_id")
                            .eq("school_id", currentSchoolId)
                            .eq("is_deleted", false)
                            .order("full_name"),
                    ]);
                    if (classError) throw classError;
                    if (studentError) throw studentError;
                    setClasses(classData || []);
                    setStudents(studentData || []);
                } else {
                    setClasses([]);
                    setStudents([]);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to load TC options.");
            } finally {
                setLoading(false);
            }
        }

        loadOptions();
    }, [isLoading, canAccess, effectiveSchoolId, profile?.school_id, queryStudentId, role]);

    useEffect(() => {
        if (!selectedStudentId) {
            setSelectedStudent(null);
            return;
        }
        if (selectedStudent?.id === selectedStudentId) return;

        async function fetchSelectedStudent() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("students_data")
                    .select("id, full_name, class_id, school_id, current_address, father_name, mother_name, dob")
                    .eq("id", selectedStudentId)
                    .single();
                if (error) throw error;
                setSelectedStudent(data);
                setSelectedClassId(data.class_id || "");
                if (role === "Superadmin" && data.school_id) {
                    setSelectedSchool(data.school_id);
                }
            } catch (err: any) {
                toast.error(err.message || "Failed to load student details.");
            } finally {
                setLoading(false);
            }
        }

        fetchSelectedStudent();
    }, [selectedStudentId, selectedStudent?.id, role]);

    const filteredStudents = selectedClassId ? students.filter((s) => s.class_id === selectedClassId) : students;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!canAccess) {
        return (
            <div className="text-center py-20 text-slate-500">
                You do not have permission to create transfer certificates.
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/dashboard/tc")}
                    className="text-slate-600 hover:text-indigo-600"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold gradient-text-primary tracking-tight flex items-center gap-2">
                        <PlusCircle className="h-7 w-7 text-indigo-500" />
                        New Transfer Certificate
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Create a new transfer certificate with the same workflow as report cards.
                    </p>
                </div>
            </div>

            {role === "Superadmin" && !profile?.school_id && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base gradient-text-primary">Select School</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>School</Label>
                            <Select value={selectedSchool} onValueChange={(value) => {
                                setSelectedSchool(value);
                                setSelectedClassId("");
                                setSelectedStudentId("");
                                setSelectedStudent(null);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a school" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-64">
                                    {schools.map((school) => (
                                        <SelectItem key={school.id} value={school.id} className="cursor-pointer hover:bg-gray-100">
                                            {school.school_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            )}

            {effectiveSchoolId && (
                <>
                    <Card className="border-indigo-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base gradient-text-primary">Select Class</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <Select value={selectedClassId} onValueChange={(value) => {
                                    setSelectedClassId(value);
                                    setSelectedStudentId("");
                                    setSelectedStudent(null);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white max-h-64">
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id} className="cursor-pointer hover:bg-gray-100">
                                                {cls.class_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base gradient-text-primary">Select Student</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Student</Label>
                                <Select value={selectedStudentId} onValueChange={(value) => setSelectedStudentId(value)} disabled={!selectedClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedClassId ? "Search & select student" : "Select class first"} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white max-h-64">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map((studentOption) => (
                                                <SelectItem key={studentOption.id} value={studentOption.id} className="cursor-pointer hover:bg-gray-100">
                                                    {studentOption.full_name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-slate-500">No students found for this class.</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {selectedStudent ? (
                <div className="space-y-6">
                    <Card className="border-indigo-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base gradient-text-primary">Selected Student</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-slate-500">Student</p>
                                <p className="font-semibold text-slate-800">{selectedStudent.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">Class</p>
                                <p className="font-semibold text-slate-800">{classes.find((cls) => cls.id === selectedStudent.class_id)?.class_name || "—"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">School</p>
                                <p className="font-semibold text-slate-800">{selectedSchool ? schools.find((sch) => sch.id === selectedSchool)?.school_name || "" : profile?.school_id ? "" : ""}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <TCForm
                        student={selectedStudent}
                        onSuccess={(tcId: string) => router.push(`/dashboard/tc/${tcId}`)}
                    />
                </div>
            ) : (
                effectiveSchoolId && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                        <p className="font-medium">Select a student above to start creating a transfer certificate.</p>
                    </div>
                )
            )}
        </div>
    );
}
