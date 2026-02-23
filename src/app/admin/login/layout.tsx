export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  // Login page renders full-screen without sidebar — override the admin layout's sidebar/padding
  return (
    <div className="fixed inset-0 z-50 bg-[var(--background)]">
      {children}
    </div>
  );
}
