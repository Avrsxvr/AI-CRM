import React from 'react';
import { Skeleton, TableSkeleton, CardSkeleton } from '@/components/Skeleton';
import { LayoutDashboard } from 'lucide-react';

export default function LeadsLoading() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-50">
      {/* Background gradients */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation Skeleton */}
      <nav className="border-b border-slate-200 bg-white/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Skeleton className="w-32 h-8 rounded-md" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Skeleton className="w-24 h-10 rounded-xl" />
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-32 h-10 rounded-xl" />
          </div>
        </div>
      </nav>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8 z-10">
        
        {/* Header Section Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="w-7 h-7 text-slate-800" />
              Campaign Overview
            </h1>
            <Skeleton className="w-64 h-4 mt-3" />
          </div>
          
          {/* Status Tabs Skeleton */}
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-slate-200">
            <Skeleton className="w-16 h-8 rounded-lg" />
            <Skeleton className="w-20 h-8 rounded-lg" />
            <Skeleton className="w-24 h-8 rounded-lg" />
            <Skeleton className="w-16 h-8 rounded-lg" />
          </div>
        </div>

        {/* Metrics Banner Skeleton */}
        <div className="grid grid-cols-3 gap-2 md:gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* 2-Column Responsive Dashboard Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Leads List Area Skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex gap-3 items-center">
              <Skeleton className="w-full h-14 rounded-2xl" />
              <Skeleton className="w-14 h-14 rounded-2xl" />
            </div>
            <TableSkeleton rowCount={8} colCount={5} />
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
              <Skeleton className="w-32 h-4 mb-6" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-2 mb-4" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-2 mb-4" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-2 mb-4" />
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-6">
              <Skeleton className="w-32 h-4 mb-6" />
              <div className="space-y-4">
                <Skeleton className="w-3/4 h-8" />
                <Skeleton className="w-full h-8" />
                <Skeleton className="w-5/6 h-8" />
                <Skeleton className="w-full h-8" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
