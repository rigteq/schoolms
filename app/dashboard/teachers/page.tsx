"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddProfileForm from "@/components/dashboard/forms/AddProfileForm";
import { useTeachers, useAdminTeachers } from "@/lib/hooks/useData";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 50;

const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function TeachersPage() {
    const router = useRouter();
    const { role, profile } = useAuth();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    const isAdmin = role === "Admin";
    const schoolId = profile?.school_id;

    const { teachers, totalCount, loading, mutate } = useTeachers({ page, search });
    const { teachers: adminTeachers, totalCount: adminTotalCount, loading: adminLoading, mutate: adminMutate } = useAdminTeachers({
        page,
        search,
        schoolId: schoolId || ""
    });

    // Use admin teachers if user is admin, otherwise use all teachers
    const displayTeachers = isAdmin ? adminTeachers : teachers;
    const displayTotal = isAdmin ? adminTotalCount : totalCount;
    const displayLoading = isAdmin ? adminLoading : loading;
    const displayMutate = isAdmin ? adminMutate : mutate;

    useEffect(() => setMounted(true), []);

    const handleRowClick = (id: string) => {
        router.push(`/dashboard/teachers/${id}`);
    };

    const totalPages = Math.ceil(displayTotal / ITEMS_PER_PAGE);

    const Pagination = () => (
        <div className="flex items-center justify-between px-2 mt-6">
            <div className="text-sm text-slate-600">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, displayTotal)} of {displayTotal} results
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-indigo-100">
                    <ChevronLeft className="h-4 w-4 text-indigo-600" />
                </Button>
                <div className="text-sm font-medium text-slate-700">Page {page} of {totalPages || 1}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="border-indigo-100">
                    <ChevronRight className="h-4 w-4 text-indigo-600" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text-primary tracking-tight">Teachers</h1>
                    <p className="text-slate-600 mt-2">{isAdmin ? "Manage teachers in your school." : "Manage all teachers across schools."}</p>
                </div>
                {(isAdmin || role === "Superadmin") && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="shrink-0 gradient-btn"><Plus className="mr-2 h-4 w-4" /> Add Teacher</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="gradient-text-primary">Onboard New Teacher</DialogTitle>
                            </DialogHeader>
                            <div className="p-4">
                                <AddProfileForm roleName="Teacher" defaultSchoolId={isAdmin ? schoolId : undefined} onSuccess={() => displayMutate()} />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Card className="border-indigo-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3 border-b border-indigo-100/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg gradient-text-primary">All Teachers</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-600" />
                            <Input type="search" placeholder="Search teachers..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {displayLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="border-none">
                                <TableRow className="border-b border-indigo-100 hover:bg-transparent">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead>Edited On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayTeachers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground border-none">No teachers found.</TableCell>
                                    </TableRow>
                                ) : (
                                    displayTeachers.map((teacher: any) => (
                                        <TableRow key={teacher.id} onClick={() => handleRowClick(teacher.id)} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="font-medium">{teacher.full_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{(Array.isArray(teacher.teachers_data) ? teacher.teachers_data[0] : teacher.teachers_data)?.subject_specialization || "General"}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                <div className="flex flex-col text-xs">
                                                    {teacher.email && <span>{teacher.email}</span>}
                                                    {teacher.phone && <span>{teacher.phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{mounted ? formatDate(teacher.created_at) : "-"}</TableCell>
                                            <TableCell>{mounted ? formatDate(teacher.modified_at) : "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                    <div className="mt-4"><Pagination /></div>
                </CardContent>
            </Card>
        </div>
    );
}
