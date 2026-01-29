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
        <header className="h-16 bg-white/80 backdrop-blur top-0 sticky z-30 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-md hover:bg-gray-100 lg:hidden text-gray-600"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-md hover:bg-gray-100 hidden lg:block text-gray-600"
                >
                    {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </button>

                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">S</div>
                    <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">SchoolMS</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-gray-500">
                    <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm ring-2 ring-white ring-offset-2 ring-offset-gray-50 outline-none hover:ring-blue-100 transition-all">
                            {role ? role.charAt(0) : 'U'}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white z-50 border border-gray-100 shadow-xl">
                        <DropdownMenuItem asChild className="focus:bg-gray-50 cursor-pointer">
                            <Link href="/dashboard/profile" className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
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
