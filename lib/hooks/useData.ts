"use client";

import useSWR from 'swr';
import {
    fetchSchoolsAction,
    fetchAdminsAction,
    fetchTeachersAction,
    fetchStudentsAction,
    fetchClassesAction,
    fetchStatsAction,
    fetchSchoolStatsAction,
    fetchAdminTeachersAction,
    fetchAdminStudentsAction,
    fetchAdminClassesAction,
    fetchTeacherClassesAction
} from '@/app/actions/data-actions';

interface UsePaginationOptions {
    page: number;
    search: string;
    itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 50;

export function useSchools({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`schools`, page, search].join('#');
    const fetcher = async () => fetchSchoolsAction(page, search, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        schools: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdmins({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`admins`, page, search].join('#');
    const fetcher = async () => fetchAdminsAction(page, search, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        admins: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useTeachers({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`teachers`, page, search].join('#');
    const fetcher = async () => fetchTeachersAction(page, search, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        teachers: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useStudents({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`students`, page, search].join('#');
    const fetcher = async () => fetchStudentsAction(page, search, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        students: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useClasses({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`classes`, page, search].join('#');
    const fetcher = async () => fetchClassesAction(page, search, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useStats() {
    const key = 'stats';
    const fetcher = async () => fetchStatsAction();

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        stats: data || { schools: 0, students: 0, teachers: 0, classes: 0 },
        loading: isLoading,
        error,
        mutate
    };
}

export function useSchoolStats(schoolId: string | undefined) {
    const key = schoolId ? `school-stats-${schoolId}` : null;
    const fetcher = async () => fetchSchoolStatsAction(schoolId);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        stats: data || { teachers: 0, students: 0, classes: 0 },
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminTeachers({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const key = [`admin-teachers`, page, search, schoolId].join('#');
    const fetcher = async () => fetchAdminTeachersAction(page, search, schoolId, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        teachers: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminStudents({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const key = [`admin-students`, page, search, schoolId].join('#');
    const fetcher = async () => fetchAdminStudentsAction(page, search, schoolId, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        students: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminClasses({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const key = [`admin-classes`, page, search, schoolId].join('#');
    const fetcher = async () => fetchAdminClassesAction(page, search, schoolId, itemsPerPage);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useTeacherClasses(teacherId: string | undefined) {
    const key = teacherId ? `teacher-classes-${teacherId}` : null;
    const fetcher = async () => fetchTeacherClassesAction(teacherId);

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 2000,
    });

    return {
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}
