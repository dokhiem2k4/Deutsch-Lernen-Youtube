export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 text-gray-400 ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>
  );
}
