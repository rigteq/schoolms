"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddClassFormProps {
    onSuccess?: () => void;
    defaultSchoolId?: string;
}

export default function AddClassForm({ onSuccess, defaultSchoolId }: AddClassFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        school_id: defaultSchoolId || "",
        class_name: "",
        academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1)
    });

    useEffect(() => {
        if (!defaultSchoolId) {
            async function fetchSchools() {
                const { data } = await supabase.from("schools").select("id, school_name").order("school_name");
                if (data) setSchools(data);
            }
            fetchSchools();
        }
    }, [defaultSchoolId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const schoolIdToUse = defaultSchoolId || formData.school_id;

        if (!schoolIdToUse) {
            setError("Please select a school");
            toast.error("Please select a school");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from("classes")
                .insert([{ ...formData, school_id: schoolIdToUse }]);

            if (insertError) throw insertError;

            toast.success("Class created successfully!");
            setFormData({ school_id: defaultSchoolId || "", class_name: "", academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1) });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to add class");
            toast.error(err.message || "Failed to add class");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                    {error}
                </div>
            )}

            {!defaultSchoolId && (
                <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Select
                        onValueChange={(val) => setFormData({ ...formData, school_id: val })}
                        value={formData.school_id}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {schools.map(school => (
                                <SelectItem key={school.id} value={school.id} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                                    {school.school_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="class_name">Class Name</Label>
                <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                    placeholder="e.g. Grade 10-A"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                    placeholder="e.g. 2025-2026"
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Class
                </Button>
            </div>
        </form>
    );
}
