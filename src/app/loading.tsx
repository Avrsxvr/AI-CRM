import { DynamicLoader } from "@/components/DynamicLoader";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm animate-in fade-in duration-300">
      <DynamicLoader messages={[]} />
    </div>
  );
}
