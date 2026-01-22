'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';

export default function WelcomePopup() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasVisited = sessionStorage.getItem('schoolms_welcome_seen');
        if (!hasVisited) {
            const timer = setTimeout(() => {
                setIsOpen(true);
                sessionStorage.setItem('schoolms_welcome_seen', 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/20 backdrop-blur-[2px]"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
                    >
                        {/* Header Image/Decoration */}
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 p-1.5 rounded-full"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SchoolMS</h3>
                            <p className="text-gray-500 mb-6">Discover the most efficient way to manage your educational institution. Interested in a demo?</p>

                            <form
                                onSubmit={(e) => { e.preventDefault(); setIsOpen(false); }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="sr-only">Email</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <button type="submit" className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                                    <Send size={18} /> Send Enquiry
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
