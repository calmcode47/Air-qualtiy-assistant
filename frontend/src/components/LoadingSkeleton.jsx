import React from 'react';

export function MetricSkeleton() {
  return (
    <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#DFD6CB] animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 bg-[#E7E0D2] rounded"></div>
        <div className="h-3 w-10 bg-[#E7E0D2] rounded"></div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="h-8 w-16 bg-[#DFD6CB] rounded-md"></div>
        <div className="h-3 w-12 bg-[#E7E0D2] rounded"></div>
      </div>
      <div className="h-2 w-full bg-[#EAE2D5] rounded"></div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-[#E6DED6] p-6 sm:p-7 paper-shadow animate-pulse space-y-6">
      <div className="flex items-center justify-between border-b border-[#E6DED6] pb-4">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-[#DFD6CB] rounded"></div>
          <div className="h-3 w-64 bg-[#E7E0D2] rounded"></div>
        </div>
        <div className="h-6 w-24 bg-[#E7E0D2] rounded-full"></div>
      </div>
      <div className="h-48 w-full bg-[#FAF7F2] rounded-2xl flex items-end gap-3 p-4">
        {[40, 65, 80, 55, 30, 45, 75, 90].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-[#E7E0D2] rounded-t-lg"
            style={{ height: `${h}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
