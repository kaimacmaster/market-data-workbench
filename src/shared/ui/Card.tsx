import React from 'react';
import { Heading } from '../../ui/heading';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-zinc-950/10 dark:border-white/10 ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-zinc-950/10 dark:border-white/10">
          <Heading level={3}>{title}</Heading>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};