'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LoginForm from '@/components/auth/LoginForm';
import WelcomePopup from '@/components/WelcomePopup';
import { motion } from 'framer-motion';
import { Shield, Users, LucideIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <WelcomePopup />

      {/* Main Container - Padded to avoid Fixed Header/Footer overlap */}
      <main className="flex-1 flex flex-col pt-16 pb-16 min-h-screen relative overflow-hidden">

        {/* Split Layout Container */}
        <div className="flex flex-1 w-full h-full relative z-10">

          {/* Left Side: Branding (Hidden on Mobile) */}
          <div className="hidden lg:flex w-[60%] flex-col justify-center p-20 bg-gray-50 relative">
            {/* Watermark */}
            <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-bold text-gray-100 select-none z-0">
              MS
            </h1>

            <div className="relative z-10 space-y-8 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Live Platform
                </div>
                <h1 className="text-6xl font-bold text-gray-900 leading-tight mb-6">
                  Education <br />
                  <span className="text-primary">Simplicity.</span>
                </h1>
                <p className="text-xl text-gray-500 leading-relaxed font-medium">
                  Streamline your entire institution with SchoolMS.
                  Designed for clarity, built for performance.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="grid grid-cols-2 gap-6"
              >
                <FeatureCard icon={Shield} title="Secure Data" text="Enterprise-grade encryption." />
                <FeatureCard icon={Users} title="Role Access" text="Granular permissions control." />
              </motion.div>
            </div>
          </div>

          {/* Right Side: Auth (Full width on Mobile) */}
          <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white lg:bg-transparent relative">
            {/* Background Shape for visual interest on mobile */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-full max-w-md"
            >
              <LoginForm />
            </motion.div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon, title: string, text: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:bg-white transition-all shadow-sm group cursor-default">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <div>
        <h4 className="font-bold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
}
