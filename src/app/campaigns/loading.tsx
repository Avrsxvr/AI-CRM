import React from 'react';
import { Skeleton, CardSkeleton } from '@/components/Skeleton';
import { LayoutDashboard } from 'lucide-react';

export default function CampaignsLoading() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-slate-50">
      <nav className="border-b border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-24 h-6 rounded-md" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Skeleton className="w-24 h-10 rounded-xl" />
            <Skeleton className="w-32 h-10 rounded-xl" />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Your Campaigns
            </h1>
            <Skeleton className="w-64 h-4 mt-3 rounded-md" />
          </div>
          
          <Skeleton className="w-full md:w-72 h-10 rounded-xl" />
        </div>

        {/* Campaign Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </main>
    </div>
  );
}
