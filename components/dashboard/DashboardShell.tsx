"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            <Sidebar
                isOpen={isSidebarOpen}
                isCollapsed={isDesktopCollapsed}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isDesktopCollapsed ? 'lg:ml-0' : ''}`}>
                <Header
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onToggleSidebar={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                    isCollapsed={isDesktopCollapsed}
                />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
