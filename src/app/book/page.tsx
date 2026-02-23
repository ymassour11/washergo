"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function BookPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function startBooking() {
      try {
        const res = await fetch("/api/bookings", { method: "POST" });
        const data = await res.json();
        if (canceled) return;
        if (!res.ok) {
          setError(data.error || "Failed to start booking");
          return;
        }
        router.replace(`/book/${data.bookingId}`);
      } catch {
        if (!canceled) setError("Network error. Please try again.");
      }
    }

    startBooking();
    return () => { canceled = true; };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-mono text-black">
        <div className="border-4 border-black p-8 max-w-md text-center brutal-shadow">
          <h1 className="text-2xl font-sans font-bold uppercase mb-4">Something went wrong</h1>
          <p className="text-base mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-[#0055FF] text-white px-6 py-3 border-2 border-black brutal-btn font-sans font-bold uppercase"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-4 border-black border-t-[#0055FF] rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest">Starting your booking...</p>
      </div>
    </div>
  );
}
