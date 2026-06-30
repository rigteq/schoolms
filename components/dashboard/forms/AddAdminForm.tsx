"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createUserWithRole } from "@/app/actions/user-actions";
import { getAgeValidationError, getMaxDate, getMinDate } from "@/lib/utils/validation";

export default function AddAdminForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schools, setSchools] = useState<any[]>([]);
    const [dobError, setDobError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        school_id: "",
        full_name: "",
        email: "",
        password: "",
        phone: "",
        dob: "",
        current_address: "",
    });

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dob = e.target.value;
        setFormData({ ...formData, dob });
        const ageError = getAgeValidationError(dob, 4, 120);
        setDobError(ageError);
    };

    useEffect(() => {
        async function fetchSchools() {
            const res = await fetch('/api/schools?limit=200');
            if (res.ok) {
                const data = await res.json();
                setSchools(data.data || []);
            }
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
                role_name: "Admin",
                address: formData.current_address,
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Admin created successfully!");
            setFormData({ school_id: "", full_name: "", email: "", password: "", phone: "", dob: "", current_address: "" });
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
                <Label htmlFor="admin_school">School</Label>
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

            <div className="space-y-2">
                <Label htmlFor="admin_full_name">Full Name</Label>
                <Input
                    id="admin_full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    placeholder="Jane Doe"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin_dob">Date of Birth</Label>
                <Input
                    id="admin_dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleDobChange}
                    required
                    min={getMinDate(120)}
                    max={getMaxDate(4)}
                />
                {dobError && (
                    <div className="text-red-500 text-sm">{dobError}</div>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin_email">Email</Label>
                <Input
                    id="admin_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="admin@school.com"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin_password">Password</Label>
                <div className="relative">
                    <Input
                        id="admin_password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="Min. 6 characters"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin_phone">Phone <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                <Input
                    id="admin_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Optional"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="admin_address">Address <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                <Textarea
                    id="admin_address"
                    value={formData.current_address}
                    onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                    placeholder="Full address including city, state and pin code"
                    rows={3}
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
