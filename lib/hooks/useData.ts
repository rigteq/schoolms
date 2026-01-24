"use client";

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

// Fetcher function for SWR
const fetcher = async (key: string) => {
    // Key format: ['table', { options }]
    // We can just pass the SQL query description logic here, but simpler is:
    // key = "schools?page=1&search="
    // Let's make a generic fetcher that handles supabase queries
    // BUT, passing query objects to keys is complex in SWR.
    // Simplest: The component passes the data fetching promise or we construct url-like keys.
    return null;
};

// We will use a custom fetcher per hook usage or a generic one.
// Let's create specific hooks for each resource to encapsulate logic.

interface UsePaginationOptions {
    page: number;
    search: string;
    itemsPerPage?: number;
}

export function useSchools({ page, search, itemsPerPage = 10 }: UsePaginationOptions) {
    const key = [`schools`, page, search, itemsPerPage];

    const fetcher = async () => {
        let query = supabase.from("schools").select("*", { count: "exact" });
        if (search) query = query.ilike("school_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
        if (error) throw error;
        return { data, count };
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true, // This solves the "infinite loading" feeling/flash
        revalidateOnFocus: false, // Don't aggressive refetch
    });

    return {
        schools: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdmins({ page, search, itemsPerPage = 10 }: UsePaginationOptions) {
    const key = [`admins`, page, search];

    const fetcher = async () => {
        const { data: roles } = await supabase.from("roles").select("id").eq("role_name", "Admin").single();
        if (!roles) return { data: [], count: 0 };

        let query = supabase.from("profiles").select(`*, schools(school_name)`, { count: "exact" }).eq("role_id", roles.id);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
        if (error) throw error;
        return { data, count };
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false });

    return {
        admins: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

// ... logic for teachers, students, classes similarly ...
export function useTeachers({ page, search, itemsPerPage = 10 }: UsePaginationOptions) {
    const key = [`teachers`, page, search];
    const fetcher = async () => {
        const { data: roles } = await supabase.from("roles").select("id").eq("role_name", "Teacher").single();
        if (!roles) return { data: [], count: 0 };

        let query = supabase.from("profiles").select(`*, schools(school_name)`, { count: "exact" }).eq("role_id", roles.id);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
        if (error) throw error;
        return { data, count };
    };
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
    return { teachers: data?.data || [], totalCount: data?.count || 0, loading: isLoading, error, mutate };
}

export function useStudents({ page, search, itemsPerPage = 10 }: UsePaginationOptions) {
    const key = [`students`, page, search];
    const fetcher = async () => {
        const { data: roles } = await supabase.from("roles").select("id").eq("role_name", "Student").single();
        if (!roles) return { data: [], count: 0 };

        let query = supabase.from("profiles").select(`*, schools(school_name)`, { count: "exact" }).eq("role_id", roles.id);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
        if (error) throw error;
        return { data, count };
    };
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
    return { students: data?.data || [], totalCount: data?.count || 0, loading: isLoading, error, mutate };
}

export function useClasses({ page, search, itemsPerPage = 10 }: UsePaginationOptions) {
    const key = [`classes`, page, search];
    const fetcher = async () => {
        let query = supabase.from("classes").select(`*, schools(school_name, address, phone, email)`, { count: "exact" });
        if (search) query = query.ilike("class_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
        if (error) throw error;
        return { data, count };
    };
    const { data, error, isLoading, mutate } = useSWR(key, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
    return { classes: data?.data || [], totalCount: data?.count || 0, loading: isLoading, error, mutate };
}

export function useStats() {
    const key = ['stats'];

    const fetcher = async () => {
        const { count: schoolsCount } = await supabase.from("schools").select("*", { count: 'exact', head: true });

        const { data: roles } = await supabase.from("roles").select("id, role_name");
        const studentRoleId = roles?.find(r => r.role_name === 'Student')?.id;
        const teacherRoleId = roles?.find(r => r.role_name === 'Teacher')?.id;

        const { count: studentsCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role_id", studentRoleId || "");
        const { count: teachersCount } = await supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role_id", teacherRoleId || "");
        const { count: classesCount } = await supabase.from("classes").select("*", { count: 'exact', head: true });

        return {
            schools: schoolsCount || 0,
            students: studentsCount || 0,
            teachers: teachersCount || 0,
            classes: classesCount || 0,
        };
    };

    const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
        keepPreviousData: true,
        revalidateOnFocus: false,
    });

    return {
        stats: data || { schools: 0, students: 0, teachers: 0, classes: 0 },
        loading: isLoading,
        error,
        mutate
    };
}
