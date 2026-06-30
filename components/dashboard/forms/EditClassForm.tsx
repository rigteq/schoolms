"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditClassFormProps {
    cls: {
        id: string;
        class_name: string;
        academic_year: string;
        school_id: string;
        class_teacher_id?: string | null;
    };
    onSuccess?: () => void;
}

export default function EditClassForm({ cls, onSuccess }: EditClassFormProps) {
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        class_name: cls.class_name || "",
        academic_year: cls.academic_year || "",
        class_teacher_id: cls.class_teacher_id || "",
    });

    useEffect(() => {
        async function fetchTeachers() {
            const res = await fetch(`/api/profiles?role=Teacher&school_id=${cls.school_id}&limit=500`);
            if (res.ok) {
                const data = await res.json();
                setTeachers(data.data || []);
            }
        }
        fetchTeachers();
    }, [cls.school_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/classes/${cls.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_name: formData.class_name,
                    academic_year: formData.academic_year,
                    class_teacher_id: formData.class_teacher_id || null,
                }),
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success("Class updated successfully!");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to update class.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit_class_name">Class Name</Label>
                <Input
                    id="edit_class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                    placeholder="e.g. Grade 10-A"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_academic_year">Academic Year</Label>
                <Input
                    id="edit_academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    required
                    placeholder="e.g. 2025-2026"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_class_teacher">Class Teacher</Label>
                <Select
                    value={formData.class_teacher_id || "none"}
                    onValueChange={(val) => setFormData({ ...formData, class_teacher_id: val === "none" ? "" : val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a teacher (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="none" className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-slate-500">
                            — No Class Teacher —
                        </SelectItem>
                        {teachers.map(t => (
                            <SelectItem key={t.id} value={t.id} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                                {t.full_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </form>
    );
}
