"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

export default function AddAdminForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        school_id: "",
        full_name: "",
        email: "",
        phone: "",
        // Admins don't always need address/dob in simple form but we can add
    });

    useEffect(() => {
        async function fetchSchools() {
            const { data } = await supabase.from("schools").select("id, school_name").order("school_name");
            if (data) setSchools(data);
        }
        fetchSchools();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.school_id) {
            setError("Please select a school");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data: roleData, error: roleError } = await supabase
                .from("roles")
                .select("id")
                .eq("role_name", "Admin")
                .single();

            if (roleError) throw new Error("Admin role not found");

            const { error: insertError } = await supabase
                .from("profiles")
                .insert([{
                    ...formData,
                    role_id: roleData.id
                }]);

            if (insertError) throw insertError;

            setFormData({ school_id: "", full_name: "", email: "", phone: "" });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to add admin");
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
                            <SelectItem key={school.id} value={school.id}>
                                {school.school_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Jane Doe"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="admin@school.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Optional"
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Admin
                </Button>
            </div>
        </form>
    );
}
