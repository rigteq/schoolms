"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
    const { profile, user, isLoading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        current_address: "",
        permanent_address: "",
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                phone: profile.phone || "",
                current_address: profile.current_address || "",
                permanent_address: profile.permanent_address || "",
            });
        }
    }, [profile]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update(formData)
                .eq("id", user.id);

            if (error) throw error;
            toast.success("Profile updated successfully");
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/auth/update-password`,
            });
            if (error) throw error;
            toast.success("Password reset email sent!");
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input value={profile?.email || ""} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input value={profile?.roles?.role_name || "User"} disabled className="bg-muted" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+1..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="current_address">Current Address</Label>
                            <Input
                                id="current_address"
                                value={formData.current_address}
                                onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                                placeholder="Street, City, Zip"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="permanent_address">Permanent Address</Label>
                            <Input
                                id="permanent_address"
                                value={formData.permanent_address}
                                onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                                placeholder="Street, City, Zip"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your password and security settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium">Password</h4>
                            <p className="text-sm text-muted-foreground">
                                Forgot your password? Send a reset link to your email.
                            </p>
                        </div>
                        <Button variant="outline" onClick={handlePasswordReset}>
                            Reset Password
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
