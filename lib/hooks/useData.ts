"use client";

import useSWR from 'swr';

interface UsePaginationOptions {
    page: number;
    search: string;
    itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 50;

const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
});

export function useSchools({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const params = new URLSearchParams({ page: String(page), search, limit: String(itemsPerPage) });
    const key = `/api/schools?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, role: 'Admin', limit: String(itemsPerPage) });
    const key = `/api/profiles?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, role: 'Teacher', limit: String(itemsPerPage) });
    const key = `/api/profiles?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, limit: String(itemsPerPage) });
    const key = `/api/students?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, limit: String(itemsPerPage) });
    const key = `/api/classes?${params}`;

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
    const { data, error, isLoading, mutate } = useSWR('/api/stats', fetcher, {
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
    const key = schoolId ? `/api/stats?school_id=${schoolId}` : null;

    const { data, error, isLoading, mutate } = useSWR(key, fetcher);

    return {
        stats: data || { teachers: 0, students: 0, classes: 0 },
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminTeachers({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const params = new URLSearchParams({ page: String(page), search, role: 'Teacher', school_id: schoolId, limit: String(itemsPerPage) });
    const key = `/api/profiles?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, school_id: schoolId, limit: String(itemsPerPage) });
    const key = `/api/students?${params}`;

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
    const params = new URLSearchParams({ page: String(page), search, school_id: schoolId, limit: String(itemsPerPage) });
    const key = `/api/classes?${params}`;

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

// Teacher-specific: fetch only the classes assigned via teachers_data.class_ids
export function useTeacherClasses(teacherId: string | undefined) {
    const key = teacherId ? `/api/teachers/${teacherId}` : null;

    const fetchTeacherClasses = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        return { data: data.classes || [], count: (data.classes || []).length };
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetchTeacherClasses, {
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
