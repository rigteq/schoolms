"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

        if (!/^\+91\d{10}$/.test(formData.phone)) {
            toast.error("Phone number must start with +91 and contain exactly 10 digits");
            return;
        }

        if (!formData.current_address?.trim()) {
            toast.error("Address is required");
            return;
        }

        setLoading(true);

        try {
            const table = isStudent ? "students_data" : "profiles";

            const { error } = await supabase
                .from(table)
                .update({
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    current_address: formData.current_address
                })
                .eq("id", profile.id);

            if (error) throw error;

            if (isTeacher) {
                const { error: teacherError } = await supabase
                    .from("teachers_data")
                    .upsert({
                        id: profile.id,
                        subject_specialization: formData.subject_specialization
                    });

                if (teacherError) throw teacherError;
            }

            toast.success("Profile updated");
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={formData.full_name} onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                            setFormData({ ...formData, full_name: val });
                        }} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    {isTeacher && (
                        <div className="space-y-2">
                            <Label>Subject Specialization</Label>
                            <Input value={formData.subject_specialization} onChange={e => {
                                const val = e.target.value.replace(/[^a-zA-Z\s.]/g, "");
                                setFormData({ ...formData, subject_specialization: val });
                            }} placeholder="e.g. Mathematics" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Phone <span className="text-red-500">*</span></Label>
                        <Input
                            value={formData.phone}
                            onChange={e => {
                                let val = e.target.value;
                                if (!val.startsWith("+91")) val = "+91" + val.replace(/^\+?9?1?/, "");
                                setFormData({ ...formData, phone: val });
                            }}
                            required
                            placeholder="+919876543210"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Address <span className="text-red-500">*</span></Label>
                        <Input
                            value={formData.current_address}
                            onChange={e => setFormData({ ...formData, current_address: e.target.value })}
                            required
                            placeholder="Full Address"
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
