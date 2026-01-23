"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AddSchoolForm from "@/components/dashboard/forms/AddSchoolForm";

const ITEMS_PER_PAGE = 10;

export default function SchoolsPage() {
    const router = useRouter();
    const [schools, setSchools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchSchools();
    }, [page, search]);

    async function fetchSchools() {
        setLoading(true);
        try {
            let query = supabase
                .from("schools")
                .select("*", { count: "exact" });

            if (search) {
                query = query.ilike("school_name", `%${search}%`);
            }

            const from = (page - 1) * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            const { data, count, error } = await query
                .range(from, to)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setSchools(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error("Error fetching schools:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleRowClick = (id: string) => {
        router.push(`/dashboard/schools/${id}`);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const Pagination = () => (
        <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">Page {page} of {totalPages || 1}</div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Schools</h1>
                    <p className="text-muted-foreground">Manage all registered schools in the system.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="shrink-0"><Plus className="mr-2 h-4 w-4" /> Add School</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New School</DialogTitle>
                        </DialogHeader>
                        <div className="p-4">
                            <AddSchoolForm onSuccess={() => fetchSchools()} />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">All Schools</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search schools..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Pagination />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>School Name</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Enrolled</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            No schools found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    schools.map((school) => (
                                        <TableRow key={school.id} onClick={() => handleRowClick(school.id)}>
                                            <TableCell className="font-medium">{school.school_name}</TableCell>
                                            <TableCell>{school.address || "N/A"}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">
                                                <div className="flex flex-col text-xs">
                                                    {school.email && <span>{school.email}</span>}
                                                    {school.phone && <span>{school.phone}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={school.is_deleted ? "destructive" : "success"}>
                                                    {school.is_deleted ? "Inactive" : "Active"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">-</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
                <div className="p-4 pt-0 border-t bg-gray-50/20">
                    <div className="mt-4">
                        <Pagination />
                    </div>
                </div>
            </Card>
        </div>
    );
}
