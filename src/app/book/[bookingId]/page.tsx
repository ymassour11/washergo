"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Stepper from "@/components/booking/stepper";

function BookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const bookingId = params.bookingId as string;
  const stepParam = searchParams.get("step");
  const canceled = searchParams.get("canceled");

  const initialStep = stepParam ? parseInt(stepParam, 10) : undefined;

  return (
    <Stepper
      bookingId={bookingId}
      initialStep={initialStep}
      canceled={!!canceled}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-slate-900">
      <div className="flex flex-col items-center gap-6">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 tracking-wide">Loading...</p>
      </div>
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <BookingContent />
    </Suspense>
  );
}
