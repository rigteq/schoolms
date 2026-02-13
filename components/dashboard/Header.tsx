"use client";

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

interface HeaderProps {
    onMenuClick: () => void;
    onToggleSidebar: () => void;
    isCollapsed: boolean;
}

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Header({ onMenuClick, onToggleSidebar, isCollapsed }: HeaderProps) {
    const { role, signOut } = useAuth();

    return (
        <header className="h-16 glass sticky top-0 z-30 flex items-center justify-between px-6 border-b border-indigo-100/20">
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
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transition-shadow">S</div>
                    <span className="font-bold text-xl tracking-tight gradient-text-primary hidden sm:block">SchoolMS</span>
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
                        <DropdownMenuItem className="text-indigo-700 focus:bg-indigo-50 focus:text-indigo-800 cursor-pointer">
                            <SettingsIcon className="mr-2 h-4 w-4 text-indigo-600" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-indigo-100" />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer">
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You will be logged out of your session.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={signOut} className="bg-red-600 hover:bg-red-700">Log out</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
