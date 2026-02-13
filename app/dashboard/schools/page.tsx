"use client";

import { useState, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddSchoolForm from "@/components/dashboard/forms/AddSchoolForm";
import { useSchools } from "@/lib/hooks/useData";

const ITEMS_PER_PAGE = 10;

const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

interface PaginationProps {
    page: number;
    totalPages: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

const Pagination = ({ page, totalPages, totalCount, onPageChange }: PaginationProps) => (
    <div className="flex items-center justify-between px-2 mt-6">
        <div className="text-sm text-slate-600">
            Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="border-indigo-100">
                <ChevronLeft className="h-4 w-4 text-indigo-600" />
            </Button>
            <div className="text-sm font-medium text-slate-700">Page {page} of {totalPages || 1}</div>
            <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || totalPages === 0} className="border-indigo-100">
                <ChevronRight className="h-4 w-4 text-indigo-600" />
            </Button>
        </div>
    </div>
);

export default function SchoolsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [mounted, setMounted] = useState(false);

    const { schools, totalCount, loading, mutate } = useSchools({ page, search });

    useLayoutEffect(() => setMounted(true), []);

    const handleRowClick = (id: string) => {
        router.push(`/dashboard/schools/${id}`);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text-primary tracking-tight">Schools</h1>
                    <p className="text-slate-600 mt-2">Manage all registered schools.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="shrink-0 gradient-btn"><Plus className="mr-2 h-4 w-4" /> Add School</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="gradient-text-primary">Add New School</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <AddSchoolForm onSuccess={() => mutate()} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-indigo-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3 border-b border-indigo-100/30">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg gradient-text-primary">All Schools</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-600" />
                            <Input type="search" placeholder="Search schools..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {loading ? (
                        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
                    ) : (
                        <Table>
                            <TableHeader className="border-none">
                                <TableRow className="border-b border-indigo-100 hover:bg-transparent">
                                    <TableHead>Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead>Edited On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground border-none">No schools found.</TableCell>
                                    </TableRow>
                                ) : (
                                    schools.map((school: any) => (
                                        <TableRow key={school.id} onClick={() => handleRowClick(school.id)} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50/50">
                                            <TableCell className="font-medium">{school.school_name}</TableCell>
                                            <TableCell>{school.address || "N/A"}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                <div className="flex flex-col text-xs">
                                                    {school.email && <span>{school.email}</span>}
                                                    {school.phone && <span>{school.phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>{mounted ? formatDate(school.created_at) : "-"}</TableCell>
                                            <TableCell>{mounted ? formatDate(school.modified_at) : "-"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                    <div className="mt-4"><Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} /></div>
                </CardContent>
            </Card>
        </div>
    );
}
