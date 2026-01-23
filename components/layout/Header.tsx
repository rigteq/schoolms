"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Header() {
    const [open, setOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        let mounted = true;
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!mounted) return;
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', user.id)
                    .single();
                setUserName(profile?.name ?? user.email ?? 'User');
            }
        })();
        return () => { mounted = false; };
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                <span className="text-lg font-semibold text-gray-900 tracking-tight">School<span className="text-primary">MS</span></span>
            </div>

            <div className="ml-auto flex items-center gap-4">
                <div className="relative">
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="flex items-center gap-3 bg-white border border-gray-200 py-1.5 px-3 rounded-lg shadow-sm"
                        aria-expanded={open}
                    >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium">{userName ? userName[0] : 'U'}</div>
                        <div className="hidden sm:block text-sm text-gray-700">{userName ?? 'Profile'}</div>
                    </button>

                    {open && (
                        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                            <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Logout</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
