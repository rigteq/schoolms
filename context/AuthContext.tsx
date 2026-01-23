"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Role = "Superadmin" | "Admin" | "Teacher" | "Student" | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: any | null;
    role: Role;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [role, setRole] = useState<Role>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        async function getProfile(userId: string) {
            try {
                const { data, error } = await supabase
                    .from("profiles")
                    .select(`
            *,
            roles (
              role_name
            )
          `)
                    .eq("id", userId) // Assuming the profile id is NOT the auth user id? 
                    // WAIT. usually profile.id matches auth.uid OR there is a separate user_id column.
                    // docs.sql says profiles.id is UUID default random. It doesn't explicitly say it sends to auth.users.id.
                    // BUT usually for Supabase Auth, we link profiles to auth.users via id or a user_id column.
                    // Let's assume for now that logic should link email or we need to check how the user wants it.
                    // "Implement robust supabase.auth.signInWithPassword"
                    // If I look at docs.sql again...
                    // It doesn't show a link to auth.users.
                    // However, standard practice is profiles.id references auth.users(id) or profiles.user_id references auth.users(id).
                    // Given the schema provided in docs.sql:
                    // 36: CREATE TABLE profiles (
                    // 37:     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    // ...
                    // 41:     email TEXT UNIQUE NOT NULL,
                    // ...
                    // )
                    // It uses email as unique.

                    // Strategy: Fetch profile by EMAIL from the auth user.
                    .eq("email", session?.user?.email || "") // This might be risky if email changes but for now it's the best link.
                    .single();

                // Wait, I can't access session inside this function call cleanly if I pass userId and assume it's auth ID.
                // Let's rely on email for mapping if the schema doesn't enforce FK.
            } catch (e) {
                console.error("Error fetching profile", e);
            }
        }

        // Actually, let's look at the schema again. 'profiles' table has 'email'.
        // So when a user logs in via Supabase Auth, they have an email. We query 'profiles' by this email.

        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user?.email) {
                    const { data: profileData, error } = await supabase
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
