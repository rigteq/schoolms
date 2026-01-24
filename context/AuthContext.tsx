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

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user?.email) {
                    const { data: profileData } = await supabase
                        .from("profiles")
                        .select(`*, roles(role_name)`)
                        .eq("email", session.user.email)
                        .single();

                    if (profileData) {
                        setProfile(profileData);
                        setRole(profileData.roles?.role_name as Role);
                    }
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user?.email) {
                setIsLoading(true);
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select(`*, roles(role_name)`)
                    .eq("email", session.user.email)
                    .single();

                if (profileData) {
                    setProfile(profileData);
                    setRole(profileData.roles?.role_name as Role);
                } else {
                    // Handle case where profile doesn't exist yet?
                    setRole(null);
                }
                setIsLoading(false);
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
