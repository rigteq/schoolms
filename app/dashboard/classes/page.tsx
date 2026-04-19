"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddClassForm from "@/components/dashboard/forms/AddClassForm";
import EditClassForm from "@/components/dashboard/forms/EditClassForm";
import { useClasses, useAdminClasses, useTeacherClasses } from "@/lib/hooks/useData";
import { useAuth } from "@/context/AuthContext";

const ITEMS_PER_PAGE = 50;

const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function ClassesPage() {
    const router = useRouter();
    const { role, profile } = useAuth();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [mounted, setMounted] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [editClass, setEditClass] = useState<any>(null);

    const isAdmin = role === "Admin";
    const isTeacher = role === "Teacher";
    const isSuperadmin = role === "Superadmin";
    const schoolId = profile?.school_id;

    const { classes, totalCount, loading, mutate } = useClasses({ page, search });
    const { classes: adminClasses, totalCount: adminTotalCount, loading: adminLoading, mutate: adminMutate } = useAdminClasses({
        page,
        search,
        schoolId: schoolId || ""
    });
    const { classes: teacherClasses, totalCount: teacherTotal, loading: teacherLoading, mutate: teacherMutate } = useTeacherClasses(
        isTeacher ? profile?.id : undefined
    );

    const displayClasses = isAdmin ? adminClasses : isTeacher ? teacherClasses : classes;
    const displayTotal = isAdmin ? adminTotalCount : isTeacher ? teacherTotal : totalCount;
    const displayLoading = isAdmin ? adminLoading : isTeacher ? teacherLoading : loading;
    const displayMutate = isAdmin ? adminMutate : isTeacher ? teacherMutate : mutate;

    useEffect(() => setMounted(true), []);

    const handleRowClick = (id: string) => {
        router.push(`/dashboard/classes/${id}`);
    };

    const totalPages = Math.ceil(displayTotal / ITEMS_PER_PAGE);

    const Pagination = () => (
        <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, displayTotal)} of {displayTotal} results
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">Page {page} of {totalPages || 1}</div>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text-primary tracking-tight">Classes</h1>
                    <p className="text-slate-600 mt-2">
                        {isTeacher ? "Your assigned classes." : isAdmin ? "Manage classes in your school." : "Manage all classes and academic years."}
                    </p>
                </div>
                {(isAdmin || isSuperadmin) && (
                    <>
                        {/* Add Class Dialog */}
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="shrink-0 gradient-btn"><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white">
                                <DialogHeader>
                                    <DialogTitle className="gradient-text-primary">Create New Class</DialogTitle>
                                </DialogHeader>
                                <div className="p-4">
                                    <AddClassForm
                                        defaultSchoolId={isAdmin ? schoolId : undefined}
                                        onSuccess={() => { displayMutate(); setAddOpen(false); }}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                        {/* Edit Class Dialog */}
                        <Dialog open={!!editClass} onOpenChange={(open) => { if (!open) setEditClass(null); }}>
                            <DialogContent className="bg-white">
                                <DialogHeader>
                                    <DialogTitle className="gradient-text-primary">Edit Class</DialogTitle>
                                </DialogHeader>
                                <div className="py-2">
                                    {editClass && (
                                        <EditClassForm
                                            cls={editClass}
                                            onSuccess={() => { displayMutate(); setEditClass(null); }}
                                        />
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                )}
            </div>

            <Card className="border-indigo-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3 border-b border-indigo-100/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg gradient-text-primary">
                            {isTeacher ? "My Classes" : "All Classes"}
                        </CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-600" />
                            <Input type="search" placeholder="Search classes..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                    <TableHead>Academic Year</TableHead>
                                    <TableHead>Class Teacher</TableHead>
                                    <TableHead>Total Students</TableHead>
                                    <TableHead>Created On</TableHead>
                                    {(isAdmin || isSuperadmin) && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayClasses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground border-none">
                                            {isTeacher ? "No classes assigned to you yet." : "No classes found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    displayClasses.map((cls: any) => (
                                        <TableRow key={cls.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="font-medium cursor-pointer" onClick={() => handleRowClick(cls.id)}>
                                                {cls.class_name}
                                            </TableCell>
                                            <TableCell className="text-slate-600">{cls.academic_year}</TableCell>
                                            <TableCell>
                                                {cls.profiles?.full_name
                                                    ? <Badge variant="secondary" className="font-normal">{cls.profiles.full_name}</Badge>
                                                    : <span className="text-slate-400 text-sm">Unassigned</span>
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {cls.students_data?.[0]?.count || 0} Students
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{mounted ? formatDate(cls.created_at) : "-"}</TableCell>
                                            {(isAdmin || isSuperadmin) && (
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                        onClick={(e) => { e.stopPropagation(); setEditClass(cls); }}
                                                    >
                                                        <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                                                    </Button>
                                                </TableCell>
                                            )}
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
