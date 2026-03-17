export default function PortalLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-50">
      {children}
    </div>
  );
}
