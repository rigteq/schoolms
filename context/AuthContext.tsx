"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
        school_id: string;
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
        school_id: string;
        roles: { role_name: string };
    } | null>(null);
    const [role, setRole] = useState<Role>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Use refs to avoid stale closures in event listeners
    const profileRef = useRef(profile);
    const mountedRef = useRef(false);

    useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    useEffect(() => {
        mountedRef.current = true;

        const fetchProfile = async (currentUser: User) => {
            if (!currentUser?.email) return;

            // Avoid re-fetching if we already have the profile for this user
            if (profileRef.current?.email === currentUser.email) return;

            try {
                // Only set loading if we don't have a profile yet (initial load)
                if (!profileRef.current) setIsLoading(true);

                const { data: profileData } = await supabase
                    .from("profiles")
                    .select(`*, roles(role_name)`)
                    .eq("email", currentUser.email)
                    .single();

                if (mountedRef.current && profileData) {
                    setProfile(profileData);
                    setRole(profileData.roles?.role_name as Role);
                }
            } catch (error) {
                console.error("Profile fetch error:", error);
            } finally {
                if (mountedRef.current) setIsLoading(false);
            }
        };

        const initializeAuth = async () => {
            try {
                // Check active session
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                // Validate session with server (handles the case where user was deleted but token remains)
                if (initialSession) {
                    const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();

                    if (userError || !validatedUser) {
                        console.warn("Session invalid, signing out...", userError);
                        await supabase.auth.signOut();
                        if (mountedRef.current) {
                            setSession(null);
                            setUser(null);
                            setProfile(null);
                            setRole(null);
                            setIsLoading(false);
                        }
                        return;
                    }

                    if (mountedRef.current) {
                        setSession(initialSession);
                        setUser(validatedUser);
                        await fetchProfile(validatedUser);
                    }
                } else {
                    if (mountedRef.current) setIsLoading(false);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                if (mountedRef.current) setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mountedRef.current) return;
            console.log("Auth Event:", event);

            const currentUser = newSession?.user ?? null;

            // Update session and user whenever auth state changes
            setSession(session);
            setUser(currentUser);
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setProfile(null);
                setRole(null);
                setIsLoading(false);
                router.push("/");
                return;
            }

            // Update session/user state
            setSession(newSession);
            setUser(currentUser);

            if (currentUser?.email) {
                await fetchProfile(currentUser);
            } else if (!currentUser) {
                // If no user, ensure we clear profile
                setProfile(null);
                setRole(null);
                setIsLoading(false);
            }
        });

        return () => {
            mountedRef.current = false;
            subscription.unsubscribe();
        };
    }, [router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setRole(null);
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
