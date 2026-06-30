import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await queryOne<{
                    id: string;
                    email: string;
                    password_hash: string;
                    full_name: string;
                    role_id: string;
                    school_id: string | null;
                    role_name: string;
                }>(
                    `SELECT p.id, p.email, p.password_hash, p.full_name, p.role_id, p.school_id, r.role_name
                     FROM profiles p
                     JOIN roles r ON r.id = p.role_id
                     WHERE p.email = $1 AND p.is_deleted = false`,
                    [credentials.email]
                );

                if (!user || !user.password_hash) return null;

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                );

                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    role: user.role_name,
                    role_id: user.role_id,
                    school_id: user.school_id,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.role_id = (user as any).role_id;
                token.school_id = (user as any).school_id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).role_id = token.role_id as string;
                (session.user as any).school_id = token.school_id as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: '/',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
});
