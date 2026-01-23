import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, gender = 'Male', role = 'Student' } = body;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: 'Missing server configuration' }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const password = randomBytes(10).toString('base64');

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    } as any);

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    const userId = (created as any)?.user?.id;
    if (!userId) return NextResponse.json({ error: 'No user id returned' }, { status: 500 });

    // Create or update profile via RPC (expects the SQL helper to exist in DB)
    await supabaseAdmin.rpc('create_or_update_profile', {
      p_id: userId,
      p_name: name,
      p_email: email,
      p_phone: phone,
      p_gender: gender,
      p_role: role
    } as any);

    return NextResponse.json({ userId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
