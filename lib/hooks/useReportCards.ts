"use client";

import useSWR from 'swr';
import {
    fetchReportCardsAction,
    fetchReportCardByIdAction,
    fetchStudentsForReportCardAction,
    fetchClassesForReportCardAction
} from '@/app/actions/report-actions';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ReportCardSubject {
    id: string;
    report_card_id: string;
    subject_name: string;
    max_marks: number;
    obtained_marks: number | null;
    grade: string | null;
    remarks: string | null;
    created_at: string;
}

export interface ReportCard {
    id: string;
    student_id: string;
    school_id: string;
    class_id: string | null;
    academic_year: string;
    term: string;
    remarks: string | null;
    created_by: string | null;
    created_at: string;
    modified_at: string;
    is_published: boolean;
    is_deleted: boolean;
    // Joined
    students_data?: { full_name: string; email: string | null };
    classes?: { class_name: string } | null;
    schools?: { school_name: string; email: string | null; phone: string | null; address: string | null };
    report_card_subjects?: ReportCardSubject[];
}

interface UseReportCardsOptions {
    page: number;
    search: string;
    classId?: string;
    academicYear?: string;
    term?: string;
    itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 50;

// ── Auto-grade helper ──────────────────────────────────────────────────────

export function autoGrade(obtained: number, max: number): string {
    if (max <= 0) return 'N/A';
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
}

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useReportCards({
    page,
    search,
    classId,
    academicYear,
    term,
    itemsPerPage = ITEMS_PER_PAGE,
}: UseReportCardsOptions) {
    const key = ['report-cards', page, search, classId, academicYear, term].join('#');
    const fetcher = async () => fetchReportCardsAction(page, search, classId, academicYear, term, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        reportCards: (data?.data || []) as ReportCard[],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate,
    };
}

export function useReportCard(id: string | undefined) {
    const key = id ? `report-card-${id}` : null;
    const fetcher = async () => fetchReportCardByIdAction(id);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return {
        reportCard: (data || null) as ReportCard | null,
        loading: isLoading,
        error,
        mutate,
    };
}

export function useStudentsForReportCard(schoolId: string | undefined) {
    const key = schoolId ? `students-for-rc-${schoolId}` : null;
    const fetcher = async () => fetchStudentsForReportCardAction(schoolId);

    const { data, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return { students: data || [], loading: isLoading };
}

export function useClassesForReportCard(schoolId: string | undefined) {
    const key = schoolId ? `classes-for-rc-${schoolId}` : null;
    const fetcher = async () => fetchClassesForReportCardAction(schoolId);

    const { data, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return { classes: data || [], loading: isLoading };
}
