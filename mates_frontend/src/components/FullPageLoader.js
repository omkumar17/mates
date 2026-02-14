export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
        <p className="text-sm opacity-70">Loading...</p>
      </div>
    </div>
  );
}
