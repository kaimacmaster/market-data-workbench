import React from 'react';
import { useConnectionStatus } from '../hooks';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const connectionState = useConnectionStatus();

  const getStatusConfig = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: '🟢',
          text: 'Live',
          description: 'Connected to live feed',
        };
      case 'connecting':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: '🟡',
          text: 'Connecting',
          description: 'Connecting to live feed...',
        };
      case 'error':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: '🔴',
          text: 'Error',
          description: 'Connection failed',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: '⚪',
          text: 'Offline',
          description: 'Not connected',
        };
    }
  };

  const status = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${className}`}>
      <span className="text-sm">{status.icon}</span>
      <span className={`text-sm font-medium ${status.color}`}>
        {status.text}
      </span>
      <span className="text-xs text-gray-500 hidden sm:inline">
        {status.description}
      </span>
    </div>
  );
};