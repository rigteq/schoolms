"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AddUserForm from '@/components/dashboards/AddUserForm';

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace('/');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                setRole(profile.role);
            } else {
                setRole('Student'); // Fallback
            }
            setLoading(false);
        };

        fetchRole();
    }, [router, supabase]);

    if (loading) return <LoadingOverlay message="Verifying Access..." />;

    return (
        <div className="min-h-screen bg-gray-50 p-8 flex flex-col pt-24 pb-24">
            <Header />
            {/* Added padding top/bottom to clear fixed header/footer if used elsewhere, 
                though typically dashboard has its own layout. using standardized spacing. */}

            <header className="mb-8 flex justify-between items-center px-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {role}.</p>
                </div>
            </header>

            <main>
                {/* Dashboard Shells Switch */}
                {role === 'Superadmin' && (
                    <div className="space-y-6">
                        <DashboardShell title="Superadmin Console" compact />
                        <AddUserForm />
                    </div>
                )}
                {role === 'Admin' && <DashboardShell title="Admin Administration" />}
                {role === 'Teacher' && <DashboardShell title="Teacher Tools" />}
                {role === 'Student' && <DashboardShell title="Student Portal" />}
            </main>

            <Footer />
        </div>
    );
}

function DashboardShell({ title, compact }: { title: string; compact?: boolean }) {
    const base = "bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center";
    const sizeClass = compact ? 'min-h-[140px] py-6' : 'min-h-[500px] py-12';

    return (
        <div className={`${base} ${sizeClass}`}>
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {title[0]}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-gray-500 mt-2">This module is ready for development.</p>
            </div>
        </div>
    );
}
