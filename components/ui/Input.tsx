'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
}

export function Input({ label, id, type = 'text', className, ...props }: InputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';

    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="w-full space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={actualType}
                    className={`
                        block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white
                        text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 
                        focus:ring-primary/20 focus:border-primary transition-all
                        ${className}
                    `}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
}
