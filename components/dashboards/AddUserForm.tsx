"use client";

import { useState } from 'react';

export default function AddUserForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('Male');
    const [role, setRole] = useState('Student');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, gender, role })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || 'Failed');
            setMessage('User created: ' + json.userId);
            setName(''); setEmail(''); setPhone(''); setGender('Male'); setRole('Student');
        } catch (err: any) {
            setMessage(err.message || 'Unexpected error');
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Add School User</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="px-3 py-2 border rounded-lg" />
                <input required value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="px-3 py-2 border rounded-lg" />
                <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone" className="px-3 py-2 border rounded-lg" />
                <select value={gender} onChange={e=>setGender(e.target.value)} className="px-3 py-2 border rounded-lg">
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                </select>
                <select value={role} onChange={e=>setRole(e.target.value)} className="px-3 py-2 border rounded-lg col-span-1 sm:col-span-2">
                    <option>Student</option>
                    <option>Teacher</option>
                    <option>Admin</option>
                </select>
            </div>

            <div className="mt-4 flex items-center gap-3">
                <button disabled={loading} type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium">{loading ? 'Creating...' : 'Create user'}</button>
                {message && <p className="text-sm text-gray-700">{message}</p>}
            </div>
        </form>
    );
}
