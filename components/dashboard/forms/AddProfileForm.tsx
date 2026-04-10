"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createUserWithRole } from "@/app/actions/user-actions";
import { getAgeValidationError, getMaxDate, getMinDate } from "@/lib/utils/validation";
import { toast } from "sonner";

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
    const [classes, setClasses] = useState<any[]>([]);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        school_id: defaultSchoolId || "",
        full_name: "",
        email: "",
        password: "",
        phone: "",
        current_address: "",
        dob: "",
        subject_name: "",
        class_id: "",
    });

    useEffect(() => {
        async function fetchSchools() {
            const { data } = await supabase.from("schools").select("id, school_name").eq("is_deleted", false).order("school_name");
            if (data) setSchools(data);
        }
        if (!defaultSchoolId) {
            fetchSchools();
        }
    }, [defaultSchoolId]);

    useEffect(() => {
        const sid = defaultSchoolId || formData.school_id;
        if (sid && roleName === "Student") {
            async function fetchClasses() {
                const { data } = await supabase
                    .from("classes")
                    .select("id, class_name")
                    .eq("school_id", sid)
                    .eq("is_deleted", false)
                    .order("class_name");
                if (data) setClasses(data);
                else setClasses([]);
            }
            fetchClasses();
        } else {
            setClasses([]);
        }
    }, [defaultSchoolId, formData.school_id, roleName]);

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
            toast.error("Please select a school");
            return;
        }

        if (roleName !== "Student" && (!formData.password || formData.password.length < 6)) {
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
                school_id: schoolIdToUse,
                role_name: roleName,
                address: formData.current_address,
                subject_name: roleName === "Teacher" ? formData.subject_name : undefined,
                class_id: roleName === "Student" ? formData.class_id : undefined,
            });

            if (!result.success) throw new Error(result.error);

            toast.success(`${roleName} created successfully!`);
            setFormData({
                school_id: defaultSchoolId || "",
                full_name: "",
                email: "",
                password: "",
                phone: "",
                current_address: "",
                dob: "",
                subject_name: "",
                class_id: ""
            });
            setDobError(null);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || `Failed to add ${roleName}`);
            toast.error(err.message || `Failed to add ${roleName}`);
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

            {/* School selector (when not pre-set) */}
            {!defaultSchoolId && (
                <div className="space-y-2">
                    <Label htmlFor="school">School</Label>
                    <Select
                        onValueChange={(val) => setFormData({ ...formData, school_id: val, class_id: "" })}
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

            {/* Class selector for Students */}
            {roleName === "Student" && (
                <div className="space-y-2">
                    <Label htmlFor="class">Class <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                    <Select
                        onValueChange={(val) => setFormData({ ...formData, class_id: val === "none" ? "" : val })}
                        value={formData.class_id || "none"}
                        disabled={!formData.school_id && !defaultSchoolId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={(!formData.school_id && !defaultSchoolId) ? "Select a school first" : "Select a class"} />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="none" className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 text-slate-500">
                                — No Class —
                            </SelectItem>
                            {classes.map(cls => (
                                <SelectItem key={cls.id} value={cls.id} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
                                    {cls.class_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Subject for Teachers */}
            {roleName === "Teacher" && (
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject Specialization</Label>
                    <Input
                        id="subject"
                        value={formData.subject_name}
                        onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                        placeholder="e.g. Mathematics"
                    />
                </div>
            )}

            {/* Full Name */}
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

            {/* Email & Password row */}
            <div className={`grid ${roleName === "Student" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                <div className="space-y-2">
                    <Label htmlFor="email">
                        Email {roleName === "Student" && <span className="text-slate-400 text-xs font-normal">(Optional)</span>}
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required={roleName !== "Student"}
                        placeholder="john@example.com"
                    />
                </div>
                {roleName !== "Student" && (
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
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
                )}
            </div>

            {/* Phone & DOB row */}
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
                        <div className="text-red-500 text-sm">{dobError}</div>
                    )}
                </div>
            </div>

            {/* Address — textarea for comfortable multi-line entry */}
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={formData.current_address}
                    onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                    placeholder="Full address including city, state and pin code"
                    rows={3}
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
