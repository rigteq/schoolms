"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "Superadmin" | "Admin" | "Teacher" | "Student" | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: {
        id: string;
        email: string;
        full_name: string;
        role_id: string;
        roles: { role_name: string };
    } | null;
    role: Role;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<{
        id: string;
        email: string;
        full_name: string;
        role_id: string;
        roles: { role_name: string };
    } | null>(null);
    const [role, setRole] = useState<Role>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const fetchProfile = async (currentUser: User) => {
            if (!currentUser?.email) return;

            // Avoid re-fetching if we already have the profile for this user
            if (profile?.email === currentUser.email) return;

            try {
                // Only set loading if we don't have a profile yet (initial load)
                if (!profile) setIsLoading(true);

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select(`*, roles(role_name)`)
                    .eq("email", currentUser.email)
                    .single();

                if (mounted && profileData) {
                    setProfile(profileData);
                    setRole(profileData.roles?.role_name as Role);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                }

                if (session?.user) {
                    await fetchProfile(session.user);
                } else {
                    if (mounted) setIsLoading(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            const currentUser = session?.user ?? null;

            // Only update state if session actually changed meaningfully
            if (session?.access_token !== session?.access_token) {
                setSession(session);
                setUser(currentUser);
            } else {
                // Even if token didn't change much, ensure we have user
                setSession(session);
                setUser(currentUser);
            }

            if (currentUser?.email) {
                // Only fetch if we are switching users or don't have a profile
                if (profile?.email !== currentUser.email) {
                    await fetchProfile(currentUser);
                } else {
                    setIsLoading(false);
                }
            } else {
                setProfile(null);
                setRole(null);
                setIsLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
