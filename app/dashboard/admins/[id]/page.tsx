"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, School, ShieldCheck } from "lucide-react";
import EditProfileDialog from "@/components/dashboard/forms/EditProfileDialog";

export default function AdminDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const fetchAdminDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select(`
             *,
             schools (school_name)
          `)
                .eq("id", id)
                .single();

            if (error) throw error;
            setAdmin(data);

        } catch (error) {
            console.error("Error fetching admin:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminDetails();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm("Are you sure? This will soft delete the admin.")) return;
        await supabase.from("profiles").update({ is_deleted: true }).eq("id", id);
        router.push("/dashboard/admins");
    }

    if (!mounted) return null;
    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!admin) return <div>Admin not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push("/dashboard/admins")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admins
            </Button>

            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-3xl font-bold">
                                {admin.full_name?.charAt(0) || "A"}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{admin.full_name}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                                    <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Administrator</span>
                                    {admin.schools?.school_name && (
                                        <span className="flex items-center gap-1"><School className="h-4 w-4" /> {admin.schools.school_name}</span>
                                    )}
                                    {admin.email && (
                                        <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {admin.email}</span>
                                    )}
                                    {admin.phone && (
                                        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {admin.phone}</span>
                                    )}
                                    {admin.current_address && (
                                        <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {admin.current_address}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <EditProfileDialog profile={admin} onSuccess={fetchAdminDetails} />
                            <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
