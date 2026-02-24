"use client";

import { XCircle } from "lucide-react";

export default function PaymentCanceledPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Canceled
        </h1>
        <p className="text-gray-600 text-lg">
          The payment was not completed. You can try again using the payment link.
        </p>
      </div>
    </div>
  );
}
