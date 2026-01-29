"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserWithRole } from "@/app/actions/user-actions";
import { getAgeValidationError, getMaxDate, getMinDate } from "@/lib/utils/validation";

export default function AddAdminForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [dobError, setDobError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        school_id: "",
        full_name: "",
        email: "",
        password: "",
        phone: "",
        dob: "",
    });

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dob = e.target.value;
        setFormData({ ...formData, dob });

        const ageError = getAgeValidationError(dob, 4, 120);
        setDobError(ageError);
    };

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
            toast.error("Please select a school");
            return;
        }
        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (!formData.dob) {
            setError("Date of birth is required");
            toast.error("Date of birth is required");
            return;
        }
        if (dobError) {
            setError(dobError);
            toast.error(dobError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createUserWithRole({
                ...formData,
                role_name: "Admin"
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Admin created successfully!");
            setFormData({ school_id: "", full_name: "", email: "", password: "", phone: "", dob: "" });
            setDobError(null);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to add admin");
            toast.error(err.message || "Failed to add admin");
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
                    <SelectContent>
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
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleDobChange}
                    required
                    min={getMinDate(120)}
                    max={getMaxDate(4)}
                />
                {dobError && (
                    <div className="text-red-500 text-sm">
                        {dobError}
                    </div>
                )}
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
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="******"
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
