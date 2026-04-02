import React from 'react';

interface Props {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className = '', variant = 'rectangular' }: Props) => {
  const baseClasses = "animate-pulse bg-white/5";
  const variantClasses = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};
