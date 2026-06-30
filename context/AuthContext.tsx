"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Role = "Superadmin" | "Admin" | "Teacher" | "Student" | null;

interface ProfileData {
    id: string;
    email: string;
    full_name: string;
    role_id: string;
    school_id: string;
    roles: { role_name: string };
    phone?: string;
    current_address?: string;
    permanent_address?: string;
}

interface AuthContextType {
    user: { id: string; email: string; name?: string | null } | null;
    session: any | null;
    profile: ProfileData | null;
    role: Role;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const isLoading = status === "loading";

    const sessionUser = session?.user as any;

    // Derive user object from session
    const user = sessionUser?.id
        ? { id: sessionUser.id, email: sessionUser.email || "", name: sessionUser.name }
        : null;

    // Derive role from session
    const role = (sessionUser?.role as Role) ?? null;

    // Build profile from session data + fetch additional fields if needed
    useEffect(() => {
        if (!sessionUser?.id) {
            setProfile(null);
            return;
        }

        // Fetch full profile from API (for phone, addresses, etc.)
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profiles/${sessionUser.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        id: data.id,
                        email: data.email,
                        full_name: data.full_name,
                        role_id: data.role_id,
                        school_id: data.school_id,
                        roles: { role_name: data.role_name || sessionUser.role || "" },
                        phone: data.phone,
                        current_address: data.current_address,
                        permanent_address: data.permanent_address,
                    });
                }
            } catch (err) {
                console.error("Profile fetch error:", err);
            }
        };

        fetchProfile();
    }, [sessionUser?.id]);

    // Redirect unauthenticated users away from dashboard
    useEffect(() => {
        if (status === "unauthenticated" && typeof window !== "undefined") {
            const path = window.location.pathname;
            if (path.startsWith("/dashboard")) {
                router.push("/");
            }
        }
    }, [status, router]);

    const signOut = async () => {
        setProfile(null);
        await nextAuthSignOut({ callbackUrl: "/" });
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
