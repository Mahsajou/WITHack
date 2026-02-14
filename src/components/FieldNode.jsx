import React from 'react';
import { DollarSign, MapPin, Film } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

const FieldNode = ({ data, selected }) => {
  const getIcon = (fieldType) => {
    switch (fieldType) {
      case 'Budget':
        return <DollarSign className="w-5 h-5" aria-hidden="true" />;
      case 'Geos':
        return <MapPin className="w-5 h-5" aria-hidden="true" />;
      case 'Genres':
        return <Film className="w-5 h-5" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'FAIL':
        return 'border-accent-red';
      case 'WARN':
        return 'border-accent-amber';
      case 'PASS':
        return 'border-accent-green';
      default:
        return 'border-dark-border';
    }
  };

  const status = data?.status || 'PASS';
  const borderColor = getStatusColor(status);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        borderColor: status === 'PASS' ? '#00d4aa' : status === 'FAIL' ? '#e50914' : '#ffa500',
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ 
        duration: 0.3,
        borderColor: { duration: 0.5 }
      }}
      className={`bg-dark-surface border-2 ${borderColor} rounded-lg p-4 min-w-[180px] shadow-lg ${
        selected ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-dark-bg' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`${data?.fieldType} field node, status: ${status}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point from contract"
      />
      <div className="flex items-center space-x-2 mb-3">
        <div className="text-gray-400">{getIcon(data?.fieldType)}</div>
        <h3 className="font-semibold text-white">{data?.fieldType}</h3>
      </div>
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-400 mb-1 block" htmlFor={`value-${data?.fieldType}`}>
            Value
          </label>
          <motion.div
            key={`${data?.value}-${data?.remediatedAt || ''}`}
            initial={data?.remediatedAt ? { 
              scale: 1.3, 
              backgroundColor: '#00d4aa',
              boxShadow: '0 0 20px rgba(0, 212, 170, 0.5)'
            } : {}}
            animate={{ 
              scale: 1, 
              backgroundColor: '#121212',
              boxShadow: 'none'
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            id={`value-${data?.fieldType}`}
            className="text-sm text-white font-medium bg-dark-bg px-2 py-1 rounded"
            aria-label={`Current value: ${data?.value || 'N/A'}`}
          >
            {data?.value || 'N/A'}
          </motion.div>
        </div>
        {data?.expected && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Expected</label>
            <div className="text-sm text-gray-300 bg-dark-bg px-2 py-1 rounded">
              {data.expected}
            </div>
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point to other nodes"
      />
    </motion.div>
  );
};

export default FieldNode;

