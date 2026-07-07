"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession, signOut as nextAuthSignOut, SessionProvider } from "next-auth/react";
import { useRouter } from "next/navigation";

type Role = "Superadmin" | "Admin" | "Teacher" | "Student" | null;

interface AuthContextType {
    user: { id: string; email: string } | null;
    session: any | null;
    profile: {
        id: string;
        email: string;
        full_name: string;
        role_id: string;
        school_id: string;
        roles: { role_name: string };
        phone?: string;
        current_address?: string;
        permanent_address?: string;
    } | null;
    role: Role;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const isLoading = status === "loading";
    const user = session?.user ? { id: (session.user as any).id, email: session.user.email! } : null;
    const role = session?.user ? ((session.user as any).role as Role) : null;
    
    // We construct a mock profile object from the session data to maintain compatibility
    // If you need more profile details like phone, you should fetch them via an API.
    const profile = session?.user ? {
        id: (session.user as any).id,
        email: session.user.email!,
        full_name: session.user.name!,
        role_id: (session.user as any).role_id,
        school_id: (session.user as any).school_id,
        roles: { role_name: (session.user as any).role }
    } : null;

    const signOut = async () => {
        await nextAuthSignOut({ redirect: false });
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, role, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProviderInner>
                {children}
            </AuthProviderInner>
        </SessionProvider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
