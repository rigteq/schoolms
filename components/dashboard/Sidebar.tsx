"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
    LayoutDashboard,
    School,
    GraduationCap,
    Users,
    BookOpen,
    X,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    FileType,
    ListChecks,
    PlusCircle
} from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href: string;
    icon: any;
    roles: string[];
    subItems?: { name: string; href: string; icon: any }[];
}

export function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { role } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

    const links: NavItem[] = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["Superadmin", "Admin", "Teacher", "Student"] },
        { name: "Schools", href: "/dashboard/schools", icon: School, roles: ["Superadmin"] },
        { name: "Admins", href: "/dashboard/admins", icon: Users, roles: ["Superadmin"] },
        { name: "Classes", href: "/dashboard/classes", icon: BookOpen, roles: ["Superadmin", "Admin", "Teacher"] },
        { name: "Teachers", href: "/dashboard/teachers", icon: GraduationCap, roles: ["Superadmin", "Admin"] },
        { name: "Students", href: "/dashboard/students", icon: Users, roles: ["Superadmin", "Admin", "Teacher"] },
        {
            name: "Leaves",
            href: "/dashboard/leaves",
            icon: CalendarDays,
            roles: ["Admin", "Teacher"],
            subItems: [
                { name: "Leave Calendar", href: "/dashboard/leaves/calendar", icon: FileType },
                { name: "Application List", href: "/dashboard/leaves/list", icon: ListChecks },
                { name: "Apply Leave", href: "/dashboard/leaves/apply", icon: PlusCircle },
            ]
        }
    ];

    const filteredLinks = links.filter(link => role && link.roles.includes(role));

    const toggleSubMenu = (name: string) => {
        if (expandedMenu === name) {
            setExpandedMenu(null);
        } else {
            setExpandedMenu(name);
        }
    };

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
                    "fixed top-0 left-0 z-50 h-screen bg-gradient-to-b from-white via-indigo-50/30 to-white shadow-2xl transition-all duration-300 transform lg:sticky border-r border-indigo-100 overflow-y-auto",
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
                    isCollapsed ? "lg:w-0 lg:p-0 border-none" : "lg:w-64"
                )}
            >
                <div className="flex items-center justify-end h-16 px-6 mb-4 lg:hidden">
                    <button onClick={onClose} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-1 rounded-md transition-all">
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

                            const hasSubItems = link.subItems && link.subItems.length > 0;
                            const isExpanded = expandedMenu === link.name || isActive; // Keep expanded if active

                            return (
                                <div key={link.name}>
                                    {hasSubItems ? (
                                        <button
                                            onClick={() => toggleSubMenu(link.name)}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap",
                                                isActive
                                                    ? "bg-gradient-to-r from-indigo-100 to-cyan-100 text-indigo-700 shadow-md"
                                                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={cn(
                                                    "h-5 w-5 flex-shrink-0 transition-all",
                                                    isActive ? "text-indigo-600" : "text-cyan-500 group-hover:text-indigo-600"
                                                )} />
                                                {!isCollapsed && <span>{link.name}</span>}
                                            </div>
                                            {!isCollapsed && (
                                                isExpanded ? <ChevronDown className="h-4 w-4 text-indigo-600" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            href={link.href}
                                            onClick={() => onClose()}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap group",
                                                isActive
                                                    ? "bg-gradient-to-r from-indigo-100 to-cyan-100 text-indigo-700 shadow-md"
                                                    : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "h-5 w-5 flex-shrink-0 transition-all",
                                                isActive ? "text-indigo-600" : "text-cyan-500 group-hover:text-indigo-600"
                                            )} />
                                            {!isCollapsed && <span>{link.name}</span>}
                                        </Link>
                                    )}

                                    {/* Sub Items */}
                                    {hasSubItems && isExpanded && !isCollapsed && (
                                        <div className="ml-9 mt-1 space-y-1 border-l-2 border-indigo-200 pl-0">
                                            {link.subItems?.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                const isSubActive = pathname === subItem.href;
                                                return (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={() => onClose()}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 block group",
                                                            isSubActive
                                                                ? "text-indigo-700 font-medium bg-indigo-50"
                                                                : "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                        )}
                                                    >
                                                        <SubIcon className={cn(
                                                            "h-4 w-4 transition-all",
                                                            isSubActive ? "text-indigo-600" : "text-cyan-400 group-hover:text-indigo-600"
                                                        )} />
                                                        <span>{subItem.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            </aside>
        </>
    );
}
