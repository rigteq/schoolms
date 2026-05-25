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

/** Validate a 12-digit Aadhar number */
function validateAadhar(val: string): string | null {
    if (!val) return null; // optional field
    const cleaned = val.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleaned)) return "Aadhar number must be exactly 12 digits.";
    return null;
}

export default function AddProfileForm({ roleName, onSuccess, defaultSchoolId }: AddProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dobError, setDobError] = useState<string | null>(null);
    const [aadharError, setAadharError] = useState<string | null>(null);
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
        // Extended student fields
        form_submitted_date: "",
        aadhar_number: "",
        mother_name: "",
        father_name: "",
        last_institution: "",
        last_institution_class: "",
        last_institution_section: "",
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

    const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData({ ...formData, aadhar_number: val });
        setAadharError(validateAadhar(val));
    };

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

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

        if (aadharError) {
            setError(aadharError);
            toast.error(aadharError);
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
                form_submitted_date: roleName === "Student" ? formData.form_submitted_date || undefined : undefined,
                aadhar_number: roleName === "Student" ? formData.aadhar_number || undefined : undefined,
                mother_name: roleName === "Student" ? formData.mother_name || undefined : undefined,
                father_name: roleName === "Student" ? formData.father_name || undefined : undefined,
                last_institution: roleName === "Student" ? formData.last_institution || undefined : undefined,
                last_institution_class: roleName === "Student" ? formData.last_institution_class || undefined : undefined,
                last_institution_section: roleName === "Student" ? formData.last_institution_section || undefined : undefined,
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
                class_id: "",
                form_submitted_date: "",
                aadhar_number: "",
                mother_name: "",
                father_name: "",
                last_institution: "",
                last_institution_class: "",
                last_institution_section: "",
            });
            setDobError(null);
            setAadharError(null);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message || `Failed to add ${roleName}`);
            toast.error(err.message || `Failed to add ${roleName}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                {/* Email */}
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

                {/* Password */}
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

                {/* Phone */}
                <div className="space-y-2">
                    <Label htmlFor="phone">
                        {roleName === "Student" ? "Guardian Mobile Number" : "Phone"}
                    </Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                    />
                </div>

                {/* DOB */}
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

            {/* Address */}
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                    id="address"
                    value={formData.current_address}
                    onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                    placeholder="Full address including city, state and pin code"
                    rows={2}
                />
            </div>

            {/* ── Extended Student Fields ── */}
            {roleName === "Student" && (
                <>
                    <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Additional Details</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Date of Submitted Form */}
                        <div className="space-y-2">
                            <Label htmlFor="form_submitted_date">
                                Date of Submitted Form <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="form_submitted_date"
                                type="date"
                                value={formData.form_submitted_date}
                                onChange={set("form_submitted_date")}
                            />
                        </div>

                        {/* Aadhar Number */}
                        <div className="space-y-2">
                            <Label htmlFor="aadhar_number">
                                Aadhar Number <span className="text-slate-400 text-xs font-normal">(Optional — 12 digits)</span>
                            </Label>
                            <Input
                                id="aadhar_number"
                                value={formData.aadhar_number}
                                onChange={handleAadharChange}
                                placeholder="1234 5678 9012"
                                maxLength={14}
                            />
                            {aadharError && <div className="text-red-500 text-sm">{aadharError}</div>}
                        </div>

                        {/* Mother's Name */}
                        <div className="space-y-2">
                            <Label htmlFor="mother_name">Mother&apos;s Name</Label>
                            <Input
                                id="mother_name"
                                value={formData.mother_name}
                                onChange={set("mother_name")}
                                placeholder="Mother's full name"
                            />
                        </div>

                        {/* Father's Name */}
                        <div className="space-y-2">
                            <Label htmlFor="father_name">Father&apos;s Name</Label>
                            <Input
                                id="father_name"
                                value={formData.father_name}
                                onChange={set("father_name")}
                                placeholder="Father's full name"
                            />
                        </div>

                        {/* Last Institution */}
                        <div className="space-y-2">
                            <Label htmlFor="last_institution">
                                Last Institution Attended <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="last_institution"
                                value={formData.last_institution}
                                onChange={set("last_institution")}
                                placeholder="Name of previous school"
                            />
                        </div>

                        {/* Class (last inst) */}
                        <div className="space-y-2">
                            <Label htmlFor="last_institution_class">
                                Class (at last institution) <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="last_institution_class"
                                value={formData.last_institution_class}
                                onChange={set("last_institution_class")}
                                placeholder="e.g. Grade 5"
                            />
                        </div>

                        {/* Section (last inst) */}
                        <div className="space-y-2">
                            <Label htmlFor="last_institution_section">
                                Section <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="last_institution_section"
                                value={formData.last_institution_section}
                                onChange={set("last_institution_section")}
                                placeholder="e.g. A"
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100">
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add {roleName}
                </Button>
            </div>
        </form>
    );
}
