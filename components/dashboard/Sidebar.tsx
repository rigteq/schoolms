"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    School,
    GraduationCap,
    Users,
    BookOpen,
    Settings,
    LogOut,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useAuth();

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Superadmin", "Admin", "Teacher", "Student"] },
        { name: "Schools", href: "/dashboard/schools", icon: School, roles: ["Superadmin"] },
        { name: "Admins", href: "/dashboard/admins", icon: Users, roles: ["Superadmin"] },
        { name: "Classes", href: "/dashboard/classes", icon: BookOpen, roles: ["Superadmin", "Admin", "Teacher"] },
        { name: "Teachers", href: "/dashboard/teachers", icon: GraduationCap, roles: ["Superadmin", "Admin"] },
        { name: "Students", href: "/dashboard/students", icon: Users, roles: ["Superadmin", "Admin", "Teacher"] },
    ];

    const filteredLinks = links.filter(link => role && link.roles.includes(role));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen bg-white shadow-xl transition-all duration-300 transform lg:static overflow-hidden",
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "lg:w-0 lg:p-0 border-none" : "lg:w-64"
                )}
            >
                <div className="flex items-center justify-end h-16 px-6 mb-4 lg:hidden">
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col justify-between h-full p-4 pt-4 lg:pt-6">
                    <nav className="space-y-1">
                        {filteredLinks.map((link) => {
                            const Icon = link.icon;
                            // Fix Dashboard Highlight: Exact match for /dashboard
                            const isActive = link.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname?.startsWith(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => onClose()}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
}
