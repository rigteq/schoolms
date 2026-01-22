'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import LoadingOverlay from '@/components/ui/LoadingOverlay';

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
            {/* Added padding top/bottom to clear fixed header/footer if used elsewhere, 
                though typically dashboard has its own layout. using standardized spacing. */}

            <header className="mb-8 flex justify-between items-center px-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {role}.</p>
                </div>
                <button
                    onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm shadow-sm"
                >
                    Sign Out
                </button>
            </header>

            <main>
                {/* Dashboard Shells Switch */}
                {role === 'Superadmin' && <DashboardShell title="Superadmin Content" />}
                {role === 'Admin' && <DashboardShell title="Admin Administration" />}
                {role === 'Teacher' && <DashboardShell title="Teacher Tools" />}
                {role === 'Student' && <DashboardShell title="Student Portal" />}
            </main>
        </div>
    );
}

function DashboardShell({ title }: { title: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm min-h-[500px] flex items-center justify-center">
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
