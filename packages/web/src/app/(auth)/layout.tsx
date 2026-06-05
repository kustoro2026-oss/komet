export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-dark)] px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
