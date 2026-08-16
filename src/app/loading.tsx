export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-16 h-16 relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        {/* Inner spinning ring */}
        <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        {/* Center dot */}
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading...
      </p>
    </div>
  );
}
