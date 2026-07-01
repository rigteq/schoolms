"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useReportCards } from "@/lib/hooks/useReportCards";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Loader2, Search, Plus, ChevronLeft, ChevronRight, FileText, Eye, Download } from "lucide-react";
import { fetchSchoolsAction, fetchAdminStudentsAction, fetchAdminClassesAction } from "@/app/actions/data-actions";
import { fetchReportCardByIdAction } from "@/app/actions/report-actions";
import { generateReportCardPdf } from "@/lib/utils/reportCardPdf";
import { toast } from "sonner";

const TERMS = ["Term 1", "Term 2", "Final Exam"];
const ITEMS_PER_PAGE = 50;

const GRADE_COLORS: Record<string, string> = {
    "A+": "bg-green-100 text-green-700 border-green-200",
    "A": "bg-green-50 text-green-600 border-green-100",
    "B+": "bg-blue-100 text-blue-700 border-blue-200",
    "B": "bg-blue-50 text-blue-600 border-blue-100",
    "C": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "D": "bg-orange-50 text-orange-700 border-orange-200",
    "F": "bg-red-100 text-red-700 border-red-200",
};

interface ReportCardListProps {
    /** If passed, list is already scoped to this school (for Admin) */
    defaultSchoolId?: string;
}

export default function ReportCardList({ defaultSchoolId }: ReportCardListProps) {
    const router = useRouter();
    const { role } = useAuth();

    const [search, setSearch] = useState("");
    const [termFilter, setTermFilter] = useState<string>("");
    const [page, setPage] = useState(1);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const { reportCards, totalCount, loading } = useReportCards({
        page,
        search,
        term: termFilter || undefined,
        itemsPerPage: ITEMS_PER_PAGE,
    });

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const canDelete = role === "Superadmin" || role === "Admin";

    // ── Quick download directly from list ──────────────────────────────────
    const handleQuickDownload = async (e: React.MouseEvent, cardId: string) => {
        e.stopPropagation();
        setDownloadingId(cardId);
        try {
            const data = await fetchReportCardByIdAction(cardId);
            if (!data) throw new Error("Report card not found");
            await generateReportCardPdf(data as any);
            toast.success("PDF downloaded!");
        } catch (err: any) {
            toast.error("Download failed: " + err.message);
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    return (
        <div className="space-y-4">
            {/* Filters & Add Button */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-indigo-400" />
                    <Input
                        placeholder="Search by student name..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <Select value={termFilter} onValueChange={(v) => { setTermFilter(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-44 border-indigo-100">
                        <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="all" className="cursor-pointer hover:bg-gray-100">All Terms</SelectItem>
                        {TERMS.map((t) => (
                            <SelectItem key={t} value={t} className="cursor-pointer hover:bg-gray-100">{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    onClick={() => router.push("/dashboard/report-cards/new")}
                    className="shrink-0 gradient-btn gap-2"
                >
                    <Plus className="h-4 w-4" /> New Report Card
                </Button>
            </div>

            {/* Table */}
            <Card className="border-indigo-100 bg-white/80 backdrop-blur">
                <CardHeader className="pb-3 border-b border-indigo-100/30">
                    <CardTitle className="text-lg gradient-text-primary flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        Report Cards
                        <Badge variant="outline" className="ml-auto text-xs border-indigo-200 text-indigo-600">
                            {totalCount} total
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-indigo-100 hover:bg-transparent">
                                    <TableHead>Student</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Year</TableHead>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportCards.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground border-none">
                                            No report cards found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reportCards.map((card) => (
                                        <TableRow
                                            key={card.id}
                                            className="cursor-pointer border-b border-gray-50 hover:bg-indigo-50/30 transition-colors"
                                            onClick={() => router.push(`/dashboard/report-cards/${card.id}`)}
                                        >
                                            <TableCell className="font-medium">
                                                {(card.students_data as any)?.full_name || "Unknown"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="border-indigo-200 text-indigo-600 text-xs">
                                                    {(card.classes as any)?.class_name || "—"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {card.academic_year}
                                            </TableCell>
                                            <TableCell className="text-sm text-slate-600">
                                                {card.term}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${card.is_published
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                                    }`}
                                                >
                                                    {card.is_published ? "Published" : "Draft"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {formatDate(card.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/dashboard/report-cards/${card.id}`);
                                                        }}
                                                        title="View"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50"
                                                        onClick={(e) => handleQuickDownload(e, card.id)}
                                                        disabled={downloadingId === card.id}
                                                        title="Download PDF"
                                                    >
                                                        {downloadingId === card.id
                                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                                            : <Download className="h-4 w-4" />
                                                        }
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 mt-6">
                            <div className="text-sm text-slate-600">
                                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-indigo-100">
                                    <ChevronLeft className="h-4 w-4 text-indigo-600" />
                                </Button>
                                <span className="text-sm font-medium text-slate-700">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border-indigo-100">
                                    <ChevronRight className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
