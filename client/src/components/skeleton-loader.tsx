import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  count = 1,
  height = '20px',
  width = '100%',
}) => {
  return (
    <div className={cn('space-y-3 fade-in', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="skeleton"
          style={{
            height,
            width,
          }}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 rounded-lg border border-border bg-card fade-in', className)}>
      <div className="skeleton h-6 w-3/4 mb-4" />
      <div className="skeleton h-4 w-full mb-2" />
      <div className="skeleton h-4 w-5/6 mb-4" />
      <div className="flex gap-4 mt-4">
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-8 w-20" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className 
}) => {
  return (
    <div className={cn('w-full fade-in', className)}>
      <div className="skeleton h-12 w-full mb-2" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton h-16 w-full mb-2" />
      ))}
    </div>
  );
};

export const ButtonSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('skeleton h-10 w-24 rounded-md', className)} />;
};