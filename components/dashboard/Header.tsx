"use client";

import { useState, useEffect } from "react";
import { Menu, Bell, User, Settings as SettingsIcon, PanelLeft, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface HeaderProps {
    onMenuClick: () => void;
    onToggleSidebar: () => void;
    isCollapsed: boolean;
}

export function Header({ onMenuClick, onToggleSidebar, isCollapsed }: HeaderProps) {
    const { role, profile, signOut } = useAuth();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [schoolName, setSchoolName] = useState<string | null>(null);

    useEffect(() => {
        if ((role === "Admin" || role === "Teacher") && profile?.school_id) {
            fetch(`/api/schools/${profile.school_id}`)
                .then(res => res.json())
                .then(data => {
                    if (data?.school?.school_name) setSchoolName(data.school.school_name);
                })
                .catch(() => {});
        } else {
            setSchoolName(null);
        }
    }, [role, profile?.school_id]);

    return (
        <>
            <header className="h-16 bg-white sticky top-0 z-30 flex items-center justify-between px-6 border-b border-indigo-200 shadow-md">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 -ml-2 rounded-lg hover:bg-indigo-50 lg:hidden text-indigo-600 hover:text-indigo-700 transition-all duration-200"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <button
                        onClick={onToggleSidebar}
                        className="p-2 rounded-lg hover:bg-indigo-50 hidden lg:block text-indigo-600 hover:text-indigo-700 transition-all duration-200"
                    >
                        {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow">
                            {schoolName ? schoolName.charAt(0).toUpperCase() : "S"}
                        </div>
                        <span className="font-bold text-xl tracking-tight gradient-text-primary hidden sm:block">
                            {schoolName || "SchoolMS"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-200">
                        <Bell className="h-5 w-5" />
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-medium text-sm ring-2 ring-white ring-offset-2 ring-offset-indigo-50 outline-none hover:ring-indigo-200 transition-all duration-200 cursor-pointer hover:shadow-lg">
                                {role ? role.charAt(0) : 'U'}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white z-50 border border-indigo-100 shadow-xl rounded-lg">
                            <DropdownMenuItem asChild className="focus:bg-indigo-50 cursor-pointer">
                                <Link href="/dashboard/profile" className="flex items-center w-full text-indigo-700 focus:text-indigo-800">
                                    <User className="mr-2 h-4 w-4 text-indigo-600" />
                                    <span>Profile</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-indigo-700 focus:bg-indigo-50 focus:text-indigo-800 cursor-pointer"
                                onSelect={(e) => { e.preventDefault(); setSettingsOpen(true); }}
                            >
                                <SettingsIcon className="mr-2 h-4 w-4 text-indigo-600" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-indigo-100" />
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); setLogoutOpen(true); }}
                                className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                            >
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Settings Coming Soon Dialog */}
            <AlertDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <AlertDialogContent className="bg-white max-w-sm">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                                <SettingsIcon className="h-5 w-5 text-white" />
                            </div>
                            <AlertDialogTitle className="text-slate-900">Settings</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-slate-600 text-base">
                            Settings will be available soon. We&apos;re working on making it better for you!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction
                            onClick={() => setSettingsOpen(false)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full"
                        >
                            Got it
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-900">Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600">
                            You will be logged out of your session.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white">
                            Log out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
