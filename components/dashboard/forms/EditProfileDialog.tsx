"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit } from "lucide-react";
import { toast } from "sonner";

interface EditProfileDialogProps {
    profile: any;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    isTeacher?: boolean;
    isStudent?: boolean;
    defaultSubject?: string;
}

/** Validate a 12-digit Aadhar number */
function validateAadhar(val: string): string | null {
    if (!val) return null;
    const cleaned = val.replace(/\s/g, "");
    if (!/^\d{12}$/.test(cleaned)) return "Aadhar number must be exactly 12 digits.";
    return null;
}

export default function EditProfileDialog({ profile, onSuccess, trigger, isTeacher, isStudent, defaultSubject }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aadharError, setAadharError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        current_address: "",
        subject_specialization: "",
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
        if (open) {
            setFormData({
                full_name: profile?.full_name || "",
                email: profile?.email || "",
                phone: profile?.phone || "",
                current_address: profile?.current_address || "",
                subject_specialization: defaultSubject || "",
                form_submitted_date: profile?.form_submitted_date || "",
                aadhar_number: profile?.aadhar_number || "",
                mother_name: profile?.mother_name || "",
                father_name: profile?.father_name || "",
                last_institution: profile?.last_institution || "",
                last_institution_class: profile?.last_institution_class || "",
                last_institution_section: profile?.last_institution_section || "",
            });
            setAadharError(null);
        }
    }, [open, profile, defaultSubject]);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));

    const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormData((prev) => ({ ...prev, aadhar_number: val }));
        setAadharError(validateAadhar(val));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (aadharError) {
            toast.error(aadharError);
            return;
        }

        setLoading(true);
        try {
            const table = isStudent ? "students_data" : "profiles";

            const baseUpdate: Record<string, any> = {
                full_name: formData.full_name,
                phone: formData.phone,
                current_address: formData.current_address,
                modified_at: new Date().toISOString(),
            };

            // Email update only for non-student profiles
            if (!isStudent) {
                baseUpdate.email = formData.email;
            } else {
                baseUpdate.email = formData.email || null;
            }

            // Merge student-specific fields
            if (isStudent) {
                Object.assign(baseUpdate, {
                    form_submitted_date: formData.form_submitted_date || null,
                    aadhar_number: formData.aadhar_number || null,
                    mother_name: formData.mother_name || null,
                    father_name: formData.father_name || null,
                    last_institution: formData.last_institution || null,
                    last_institution_class: formData.last_institution_class || null,
                    last_institution_section: formData.last_institution_section || null,
                });
            }

            const { error } = await supabase
                .from(table)
                .update(baseUpdate)
                .eq("id", profile.id);

            if (error) throw error;

            if (isTeacher) {
                const { error: teacherError } = await supabase
                    .from("teachers_data")
                    .upsert({ id: profile.id, subject_specialization: formData.subject_specialization });
                if (teacherError) throw teacherError;
            }

            toast.success("Profile updated successfully.");
            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>}
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-white to-indigo-50/30 max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="gradient-text-primary">Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* Top row: core fields in a 3-col grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={formData.full_name} onChange={set("full_name")} required />
                        </div>

                        <div className="space-y-2">
                            <Label>Email {isStudent && <span className="text-slate-400 text-xs font-normal">(Optional)</span>}</Label>
                            <Input type="email" value={formData.email} onChange={set("email")} required={!isStudent} />
                        </div>

                        <div className="space-y-2">
                            <Label>{isStudent ? "Guardian Mobile Number" : "Phone"}</Label>
                            <Input value={formData.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
                        </div>

                        {isTeacher && (
                            <div className="space-y-2">
                                <Label>Subject Specialization</Label>
                                <Input value={formData.subject_specialization} onChange={set("subject_specialization")} placeholder="e.g. Mathematics" />
                            </div>
                        )}
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                            value={formData.current_address}
                            onChange={set("current_address")}
                            placeholder="Full address including city, state and pin code"
                            rows={2}
                        />
                    </div>

                    {/* ── Extended Student Fields ── */}
                    {isStudent && (
                        <>
                            <div className="border-t border-slate-100 pt-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Additional Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Date of Submitted Form <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                                        <Input type="date" value={formData.form_submitted_date} onChange={set("form_submitted_date")} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Aadhar Number <span className="text-slate-400 text-xs font-normal">(Optional — 12 digits)</span></Label>
                                        <Input
                                            value={formData.aadhar_number}
                                            onChange={handleAadharChange}
                                            placeholder="1234 5678 9012"
                                            maxLength={14}
                                        />
                                        {aadharError && <div className="text-red-500 text-sm">{aadharError}</div>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Mother&apos;s Name</Label>
                                        <Input value={formData.mother_name} onChange={set("mother_name")} placeholder="Mother's full name" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Father&apos;s Name</Label>
                                        <Input value={formData.father_name} onChange={set("father_name")} placeholder="Father's full name" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Last Institution Attended <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                                        <Input value={formData.last_institution} onChange={set("last_institution")} placeholder="Name of previous school" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Class at Last Institution <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                                        <Input value={formData.last_institution_class} onChange={set("last_institution_class")} placeholder="e.g. Grade 5" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Section <span className="text-slate-400 text-xs font-normal">(Optional)</span></Label>
                                        <Input value={formData.last_institution_section} onChange={set("last_institution_section")} placeholder="e.g. A" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="border-t border-slate-100 pt-4">
                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
