"use client";

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

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

    const fetcher = async () => {
        let query = supabase
            .from('report_cards')
            .select(
                `*, 
                students_data(full_name, email),
                classes(class_name),
                schools(school_name)`,
                { count: 'exact' }
            )
            .eq('is_deleted', false);

        if (search) query = query.ilike('students_data.full_name', `%${search}%`);
        if (classId) query = query.eq('class_id', classId);
        if (academicYear) query = query.eq('academic_year', academicYear);
        if (term) query = query.eq('term', term);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, count };
    };

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

    const fetcher = async () => {
        if (!id) return null;
        const { data, error } = await supabase
            .from('report_cards')
            .select(
                `*, 
                students_data(full_name, email, phone, dob, parent_name, parent_phone),
                classes(class_name, academic_year),
                schools(school_name, email, phone, address),
                report_card_subjects(*)`
            )
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as ReportCard;
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return {
        reportCard: data || null,
        loading: isLoading,
        error,
        mutate,
    };
}

export function useStudentsForReportCard(schoolId: string | undefined) {
    const key = schoolId ? `students-for-rc-${schoolId}` : null;

    const fetcher = async () => {
        if (!schoolId) return [];
        const { data, error } = await supabase
            .from('students_data')
            .select('id, full_name, class_id, classes(class_name)')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('full_name');

        if (error) throw error;
        return data || [];
    };

    const { data, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return { students: data || [], loading: isLoading };
}

export function useClassesForReportCard(schoolId: string | undefined) {
    const key = schoolId ? `classes-for-rc-${schoolId}` : null;

    const fetcher = async () => {
        if (!schoolId) return [];
        const { data, error } = await supabase
            .from('classes')
            .select('id, class_name, academic_year')
            .eq('school_id', schoolId)
            .eq('is_deleted', false)
            .order('class_name');

        if (error) throw error;
        return data || [];
    };

    const { data, isLoading } = useSWR(key, fetcher, {
        revalidateOnFocus: false,
    });

    return { classes: data || [], loading: isLoading };
}
