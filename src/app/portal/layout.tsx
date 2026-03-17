"use client";

import { SessionProvider } from "next-auth/react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-[#f5f5f0]">
        <PortalSidebar />
        <div className="lg:pl-64">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
