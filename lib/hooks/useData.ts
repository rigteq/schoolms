"use client";

import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

interface UsePaginationOptions {
    page: number;
    search: string;
    itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 50;
const roleIdCache = new Map<string, string>();

async function getRoleId(roleName: string) {
    if (roleIdCache.has(roleName)) {
        return roleIdCache.get(roleName) ?? null;
    }

    const { data, error } = await supabase.from("roles").select("id").eq("role_name", roleName).single();
    if (error || !data) return null;

    roleIdCache.set(roleName, data.id);
    return data.id;
}

export function useSchools({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`schools`, page, search].join('#');

    const fetcher = async () => {
        let query = supabase.from("schools").select("*", { count: "exact" }).eq("is_deleted", false);
        if (search) query = query.ilike("school_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        schools: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdmins({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`admins`, page, search].join('#');

    const fetcher = async () => {
        const roleId = await getRoleId("Admin");
        if (!roleId) return { data: [], count: 0 };

        let query = supabase.from("profiles").select(`*, schools(school_name)`, { count: "exact" }).eq("role_id", roleId).eq("is_deleted", false);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        admins: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useTeachers({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`teachers`, page, search].join('#');

    const fetcher = async () => {
        const roleId = await getRoleId("Teacher");
        if (!roleId) return { data: [], count: 0 };

        let query = supabase.from("profiles")
            .select(`*, schools(school_name), teachers_data(subject_specialization)`, { count: "exact" })
            .eq("role_id", roleId).eq("is_deleted", false);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        teachers: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useStudents({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`students`, page, search].join('#');

    const fetcher = async () => {
        let query = supabase.from("students_data")
            .select(`*, schools(school_name), classes(class_name)`, { count: "exact" })
            .eq("is_deleted", false);
        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        students: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useClasses({ page, search, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions) {
    const key = [`classes`, page, search].join('#');

    const fetcher = async () => {
        let query = supabase.from("classes")
            .select(`*, schools(school_name, address, phone, email), profiles!class_teacher_id(full_name), students_data(count)`, { count: "exact" })
            .eq("is_deleted", false);
        if (search) query = query.ilike("class_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useStats() {
    const key = 'stats';

    const fetcher = async () => {
        const [schoolsResult, studentsResult, classesResult] = await Promise.all([
            supabase.from("schools").select("*", { count: 'exact', head: true }).eq("is_deleted", false),
            supabase.from("students_data").select("*", { count: 'exact', head: true }).eq("is_deleted", false),
            supabase.from("classes").select("*", { count: 'exact', head: true }).eq("is_deleted", false),
        ]);

        const teacherRoleId = await getRoleId("Teacher");
        const teachersResult = await supabase
            .from("profiles")
            .select("*", { count: 'exact', head: true })
            .eq("role_id", teacherRoleId || "")
            .eq("is_deleted", false);

        return {
            schools: schoolsResult.count || 0,
            students: studentsResult.count || 0,
            teachers: teachersResult.count || 0,
            classes: classesResult.count || 0,
        };
    };

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

    const fetcher = async () => {
        if (!schoolId) return { teachers: 0, students: 0, classes: 0 };

        const teacherRoleId = await getRoleId("Teacher");

        const [teachersResult, studentsResult, classesResult] = await Promise.all([
            supabase.from("profiles")
                .select("*", { count: 'exact', head: true })
                .eq("school_id", schoolId)
                .eq("role_id", teacherRoleId || "")
                .eq("is_deleted", false),
            supabase.from("students_data")
                .select("*", { count: 'exact', head: true })
                .eq("school_id", schoolId)
                .eq("is_deleted", false),
            supabase.from("classes")
                .select("*", { count: 'exact', head: true })
                .eq("school_id", schoolId)
                .eq("is_deleted", false),
        ]);

        return {
            teachers: teachersResult.count || 0,
            students: studentsResult.count || 0,
            classes: classesResult.count || 0,
        };
    };

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

    const fetcher = async () => {
        const roleId = await getRoleId("Teacher");
        if (!roleId) return { data: [], count: 0 };

        let query = supabase.from("profiles")
            .select(`*, schools(school_name), teachers_data(subject_specialization)`, { count: "exact" })
            .eq("role_id", roleId)
            .eq("school_id", schoolId)
            .eq("is_deleted", false);

        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        teachers: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminStudents({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const key = [`admin-students`, page, search, schoolId].join('#');

    const fetcher = async () => {
        let query = supabase.from("students_data")
            .select(`*, schools(school_name), classes(class_name)`, { count: "exact" })
            .eq("school_id", schoolId)
            .eq("is_deleted", false);

        if (search) query = query.ilike("full_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        students: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

export function useAdminClasses({ page, search, schoolId, itemsPerPage = ITEMS_PER_PAGE }: UsePaginationOptions & { schoolId: string }) {
    const key = [`admin-classes`, page, search, schoolId].join('#');

    const fetcher = async () => {
        let query = supabase.from("classes")
            .select(`*, schools(school_name, address, phone, email), profiles!class_teacher_id(full_name), students_data(count)`, { count: "exact" })
            .eq("school_id", schoolId)
            .eq("is_deleted", false);

        if (search) query = query.ilike("class_name", `%${search}%`);

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data, count, error } = await query.range(from, to).order("created_at", { ascending: false });
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
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}

// Teacher-specific: fetch only the classes assigned via teachers_data.class_ids
export function useTeacherClasses(teacherId: string | undefined) {
    const key = teacherId ? `teacher-classes-${teacherId}` : null;

    const fetcher = async () => {
        if (!teacherId) return { data: [], count: 0 };

        // Get the teacher's assigned class IDs
        const { data: teacherData, error: tErr } = await supabase
            .from("teachers_data")
            .select("class_ids")
            .eq("id", teacherId)
            .maybeSingle();

        if (tErr) throw tErr;
        const classIds: string[] = teacherData?.class_ids || [];
        if (classIds.length === 0) return { data: [], count: 0 };

        const { data, count, error } = await supabase
            .from("classes")
            .select(`*, schools(school_name), profiles!class_teacher_id(full_name), students_data(count)`, { count: "exact" })
            .in("id", classIds)
            .eq("is_deleted", false);

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
        classes: data?.data || [],
        totalCount: data?.count || 0,
        loading: isLoading,
        error,
        mutate
    };
}
