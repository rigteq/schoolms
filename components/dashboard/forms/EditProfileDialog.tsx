"use client";

import { useState, useEffect } from "react";
import { updateProfileAction, updateStudentAction, updateTeacherSubjectsAction } from "@/app/actions/mutations";
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

export default function EditProfileDialog({ profile, onSuccess, trigger, isTeacher, isStudent, defaultSubject }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        current_address: profile?.current_address || "",
        subject_specialization: defaultSubject || "",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                full_name: profile?.full_name || "",
                email: profile?.email || "",
                phone: profile?.phone || "",
                current_address: profile?.current_address || "",
                subject_specialization: defaultSubject || "",
            });
        }
    }, [open, profile, defaultSubject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isStudent) {
                const { error } = await updateStudentAction(profile.id, {
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    current_address: formData.current_address,
                    modified_at: new Date().toISOString(),
                });
                if (error) throw error;
            } else {
                const { error } = await updateProfileAction(profile.id, {
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    current_address: formData.current_address,
                    modified_at: new Date().toISOString(),
                });
                if (error) throw error;
            }

            if (isTeacher) {
                const { error: teacherError } = await updateTeacherSubjectsAction(profile.id, {
                    subject_specialization: formData.subject_specialization
                });
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
            <DialogContent className="bg-gradient-to-br from-white to-indigo-50/30">
                <DialogHeader>
                    <DialogTitle className="gradient-text-primary">Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Email {isStudent && <span className="text-slate-400 text-xs font-normal">(Optional)</span>}</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required={!isStudent} />
                    </div>
                    {isTeacher && (
                        <div className="space-y-2">
                            <Label>Subject Specialization</Label>
                            <Input value={formData.subject_specialization} onChange={e => setFormData({ ...formData, subject_specialization: e.target.value })} placeholder="e.g. Mathematics" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea
                            value={formData.current_address}
                            onChange={e => setFormData({ ...formData, current_address: e.target.value })}
                            placeholder="Full address including city, state and pin code"
                            rows={3}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
