"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-bold">Invalid invite link.</p>
        <p className="text-sm text-black/40 mt-2 font-medium">Please check the link from your email or contact support.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/portal/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/portal/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-700 font-bold text-lg">Account created!</p>
        <p className="text-sm text-black/40 mt-2 font-medium">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">
          Name <span className="text-black/30 normal-case tracking-normal font-medium">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
          placeholder="Your name"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">
          Create Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
          placeholder="Min 8 characters"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3.5 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
          placeholder="Repeat your password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#0055FF] px-4 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#0044CC] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0055FF]/20"
      >
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating account...
          </>
        ) : (
          "Create Account"
        )}
      </button>
      <p className="text-xs text-center text-black/30 font-medium">
        Already have an account?{" "}
        <a href="/portal/login" className="text-[#0055FF] hover:underline font-bold">
          Sign in
        </a>
      </p>
    </form>
  );
}

export default function PortalRegisterPage() {
  return (
    <main className="flex min-h-screen bg-[#0a0a0a]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0055FF] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-2 border-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="text-white/60 text-sm font-bold uppercase tracking-widest">Welcome to GoWash</div>
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          <h1 className="text-8xl font-black text-white tracking-tighter uppercase leading-[0.85]">
            Set<br />Up.
          </h1>
          <p className="text-xl text-white/70 font-medium max-w-sm leading-relaxed">
            Create your account to start managing your washer & dryer rental online.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-white/50 text-xs font-bold uppercase tracking-wider">Secure registration</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#f5f5f0]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#0055FF] flex items-center justify-center border-2 border-black/10">
                <span className="text-white font-black text-base">G</span>
              </div>
              <span className="text-2xl font-black text-black tracking-tight uppercase">GoWash</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-black tracking-tight">Create Your Account</h2>
            <p className="text-sm text-black/40 mt-2 font-medium">Set up your customer portal access</p>
          </div>

          <div className="rounded-xl bg-white border-2 border-black/5 shadow-xl shadow-black/5 p-7">
            <Suspense fallback={<div className="text-center text-black/40 py-8">Loading...</div>}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
