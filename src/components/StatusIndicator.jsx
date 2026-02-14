import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const StatusIndicator = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PASS':
        return {
          icon: CheckCircle2,
          color: 'text-accent-green',
          bgColor: 'bg-green-900/20',
          ariaLabel: 'Pass',
        };
      case 'FAIL':
        return {
          icon: XCircle,
          color: 'text-accent-red',
          bgColor: 'bg-red-900/20',
          ariaLabel: 'Fail',
        };
      case 'WARN':
        return {
          icon: AlertTriangle,
          color: 'text-accent-amber',
          bgColor: 'bg-amber-900/20',
          ariaLabel: 'Warning',
        };
      default:
        return {
          icon: AlertTriangle,
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/20',
          ariaLabel: 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center justify-center ${config.bgColor} ${config.color} rounded-full p-1`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon size={iconSize} aria-hidden="true" />
    </motion.div>
  );
};

export default StatusIndicator;

