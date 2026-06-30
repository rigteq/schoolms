"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EditSchoolFormProps {
    school: {
        id: string;
        school_name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    onSuccess?: () => void;
}

export default function EditSchoolForm({ school, onSuccess }: EditSchoolFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        school_name: school.school_name || "",
        address: school.address || "",
        phone: school.phone || "",
        email: school.email || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from("schools")
                .update({ ...formData, modified_at: new Date().toISOString() })
                .eq("id", school.id);

            if (error) throw error;

            toast.success("School updated successfully!");
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to update school.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="edit_school_name">School Name</Label>
                <Input
                    id="edit_school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                    placeholder="e.g. Springfield High"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_school_email">Email</Label>
                <Input
                    id="edit_school_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@school.com"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_school_phone">Phone</Label>
                <Input
                    id="edit_school_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 890"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="edit_school_address">Address</Label>
                <Textarea
                    id="edit_school_address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Education Lane, City, State"
                    rows={3}
                />
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
