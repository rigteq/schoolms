"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Section: Branding/Stats - 60% */}
      <div className="hidden lg:flex w-[60%] flex-col relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-cyan-50" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover opacity-5 mix-blend-overlay" />

        <div className="relative z-10 flex flex-col h-full p-12 text-slate-900 justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            <h1 className="text-2xl font-bold tracking-tight gradient-text-primary">SchoolMS</h1>
          </div>

          <div className="space-y-6 max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold leading-tight text-slate-900"
            >
              Manage your institution with precision and elegance.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-700"
            >
              The most advanced school management portal designed for efficiency, clarity, and growth.
            </motion.p>
          </div>

          <div className="flex gap-8">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">500+</p>
              <p className="text-sm text-slate-600">Schools Trusted</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">1M+</p>
              <p className="text-sm text-slate-600">Students Active</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-slate-900">99.9%</p>
              <p className="text-sm text-slate-600">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section: Login - 40% */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header - Mobile Logo */}
        <header className="h-16 flex items-center px-6 lg:hidden border-b">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg mr-2">S</div>
          <span className="font-bold text-gray-900">SchoolMS</span>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 h-full text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-11 text-base shadow-lg hover:shadow-xl transition-all">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Sign In securely
              </Button>
            </form>
          </div>
        </main>

        <footer className="h-16 flex items-center justify-center border-t text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            Powered by <strong className="font-semibold text-gray-900">Rigteq</strong>
          </span>
        </footer>
      </div>
    </div>
  );
}
