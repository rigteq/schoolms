"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AddProfileFormProps {
    roleName: "Teacher" | "Student";  // Restrict to these for now
    onSuccess?: () => void;
    defaultSchoolId?: string;
}

export default function AddProfileForm({ roleName, onSuccess, defaultSchoolId }: AddProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        school_id: defaultSchoolId || "",
        full_name: "",
        email: "",
        phone: "",
        current_address: "",
        dob: "" // Date of Birth
    });

    useEffect(() => {
        async function fetchSchools() {
            // If defaultSchoolId is provided, we might not need to fetch all, but let's do it for generic use
            const { data } = await supabase.from("schools").select("id, school_name").order("school_name");
            if (data) setSchools(data);
        }
        if (!defaultSchoolId) {
            fetchSchools();
        }
    }, [defaultSchoolId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.school_id && !defaultSchoolId) {
            setError("Please select a school");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            // Get Role ID
            const { data: roleData, error: roleError } = await supabase
                .from("roles")
                .select("id")
                .eq("role_name", roleName)
                .single();

            if (roleError || !roleData) throw new Error("Invalid Role Configuration");

            const profileData = {
                ...formData,
                school_id: defaultSchoolId || formData.school_id,
                role_id: roleData.id
            };

            const { error: insertError } = await supabase
                .from("profiles")
                .insert([profileData]);

            if (insertError) throw insertError;

            // Optionally create auth user?
            // The prompt says: "Write SQL to create an admin user in Supabase...".
            // But for "Add Student", usually we create a profile first, then they claim it?
            // Or we create Auth User here?
            // "Auth Logic: Implement robust supabase.auth.signInWithPassword"
            // Usually, creating a profile implies creating a user.
            // But for simplicity in this step (just adding to DB), I'll stick to 'profiles' table insertion.
            // Real-world: Use Admin API to create user or invite.
            // I'll stick to just Profile creation as per prompt "Add Student Forms" (usually implies data entry).

            setFormData({ school_id: defaultSchoolId || "", full_name: "", email: "", phone: "", current_address: "", dob: "" });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || `Failed to add ${roleName}`);
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
                        <SelectContent>
                            {schools.map(school => (
                                <SelectItem key={school.id} value={school.id}>
                                    {school.school_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="John Doe"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="john@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234..."
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    value={formData.current_address}
                    onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                    placeholder="Full Address"
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add {roleName}
                </Button>
            </div>
        </form>
    );
}
