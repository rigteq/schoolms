"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createUserWithRole } from "@/app/actions/user-actions";
import { getAgeValidationError, getMaxDate, getMinDate } from "@/lib/utils/validation";

interface AddProfileFormProps {
    roleName: "Teacher" | "Student";
    onSuccess?: () => void;
    defaultSchoolId?: string;
}

export default function AddProfileForm({ roleName, onSuccess, defaultSchoolId }: AddProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dobError, setDobError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        school_id: defaultSchoolId || "",
        full_name: "",
        email: "",
        password: "",
        phone: "",
        current_address: "",
        dob: ""
    });

    useEffect(() => {
        async function fetchSchools() {
            const { data } = await supabase.from("schools").select("id, school_name").order("school_name");
            if (data) setSchools(data);
        }
        if (!defaultSchoolId) {
            fetchSchools();
        }
    }, [defaultSchoolId]);

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dob = e.target.value;
        setFormData({ ...formData, dob });
        
        const ageError = getAgeValidationError(dob, 4, 120);
        setDobError(ageError);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const schoolIdToUse = defaultSchoolId || formData.school_id;

        if (!schoolIdToUse) {
            setError("Please select a school");
            return;
        }

        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (!formData.dob) {
            setError("Date of birth is required");
            return;
        }

        if (dobError) {
            setError(dobError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await createUserWithRole({
                ...formData,
                school_id: schoolIdToUse,
                role_name: roleName,
                address: formData.current_address
            });

            if (!result.success) throw new Error(result.error);

            setFormData({ school_id: defaultSchoolId || "", full_name: "", email: "", password: "", phone: "", current_address: "", dob: "" });
            setDobError(null);
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
                        <SelectContent className="bg-white">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 234..."
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
