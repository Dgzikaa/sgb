'use client';

import React from 'react';

export function SkeletonLine({ width = '100%', height = 12, className = '' }: { width?: string | number; height?: number; className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card-dark p-6 space-y-3">
      <SkeletonLine width="60%" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} />
      ))}
    </div>
  );
}

export default { SkeletonLine, SkeletonCard };


