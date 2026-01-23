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
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { role, signOut } = useAuth();

    const links = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Superadmin", "Admin", "Teacher", "Student"] },
        { name: "Schools", href: "/dashboard/schools", icon: School, roles: ["Superadmin"] },
        { name: "Classes", href: "/dashboard/classes", icon: BookOpen, roles: ["Superadmin", "Admin", "Teacher"] },
        { name: "Teachers", href: "/dashboard/teachers", icon: GraduationCap, roles: ["Superadmin", "Admin"] },
        { name: "Students", href: "/dashboard/students", icon: Users, roles: ["Superadmin", "Admin", "Teacher"] },
        { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["Superadmin", "Admin"] },
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
                    "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r transition-transform duration-300 transform lg:translate-x-0 lg:static",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">S</div>
                        <span className="font-bold text-xl tracking-tight">SchoolMS</span>
                    </div>
                    <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col justify-between h-[calc(100vh-64px)] p-4">
                    <nav className="space-y-1">
                        {filteredLinks.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => onClose()}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {role?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">User</p>
                                <p className="text-xs text-muted-foreground truncate">{role}</p>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={signOut}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
