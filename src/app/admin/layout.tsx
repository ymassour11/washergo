"use client";

import { SessionProvider } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function useAdminTheme() {
  return useContext(ThemeContext);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as Theme | null;
    if (stored === "light") setTheme("light");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  };

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ theme, toggle }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('admin-theme');if(t==='light'){var el=document.currentScript.nextElementSibling;if(el)el.setAttribute('data-theme','light')}}catch(e){}})()`,
          }}
        />
        <div
          data-theme={theme}
          suppressHydrationWarning
          className="min-h-screen bg-[var(--background)]"
        >
          <AdminSidebar />
          <div className="lg:pl-64">
            {children}
          </div>
        </div>
      </ThemeContext.Provider>
    </SessionProvider>
  );
}
