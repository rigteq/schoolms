"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddSchoolForm({ onSuccess }: { onSuccess?: () => void }) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        school_name: "",
        address: "",
        phone: "",
        email: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!/^\+91\d{10}$/.test(formData.phone)) {
            toast.error("Phone number must start with +91 and contain exactly 10 digits");
            return;
        }
        if (!formData.address?.trim()) {
            toast.error("Address is required");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                email: formData.email ? formData.email : null
            };

            const { data, error: insertError } = await supabase
                .from("schools")
                .insert([payload])
                .select()
                .single();

            if (insertError) {
                console.error("Supabase Error:", insertError);
                throw new Error(insertError.message || "Failed to create school");
            }

            toast.success("School created successfully!");
            setFormData({ school_name: "", address: "", phone: "", email: "" });
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Submission Error:", err);
            toast.error(err.message || "Something went wrong. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="school_name">School Name</Label>
                <Input
                    id="school_name"
                    value={formData.school_name}
                    onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                    required
                    placeholder="e.g. Springfield High"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="admin@school.com"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith("+91")) val = "+91" + val.replace(/^\+?9?1?/, "");
                        setFormData({ ...formData, phone: val });
                    }}
                    required
                    placeholder="+919876543210"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="123 Education Lane"
                />
            </div>
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create School
                </Button>
            </div>
        </form>
    );
}
