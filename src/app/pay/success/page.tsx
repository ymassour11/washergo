"use client";

import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Received
        </h1>
        <p className="text-gray-600 text-lg">
          The payment has been processed successfully. The subscription is now active.
        </p>
      </div>
    </div>
  );
}
