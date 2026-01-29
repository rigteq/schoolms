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
    defaultSubject?: string;
}

export default function EditProfileDialog({ profile, onSuccess, trigger, isTeacher, defaultSubject }: EditProfileDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || "",
        phone: profile?.phone || "",
        current_address: profile?.current_address || "",
        subject_specialization: defaultSubject || "",
    });

    useEffect(() => {
        if (open) {
            setFormData({
                full_name: profile?.full_name || "",
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
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
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
                        <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
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
                        <Input value={formData.current_address} onChange={e => setFormData({ ...formData, current_address: e.target.value })} />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
