import React from 'react';
import { Handle, Position } from 'reactflow';
import { Users, MapPin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusIndicator from '../StatusIndicator';

const AudienceNode = ({ data, selected }) => {
  const status = data?.status || 'PASS';
  const hasSeverance = data?.hasSeverance || false;

  const getBorderColor = () => {
    if (hasSeverance || status === 'FAIL') return 'border-accent-red';
    if (status === 'WARN') return 'border-accent-amber';
    return 'border-accent-green';
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-dark-surface border-2 ${getBorderColor()} rounded-lg p-4 min-w-[220px] shadow-lg ${
        selected ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-dark-bg' : ''
      } ${hasSeverance ? 'ring-2 ring-accent-red ring-offset-2 ring-offset-dark-bg' : ''}`}
      tabIndex={0}
      role="button"
      aria-label={`Audience node, status: ${status}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point from contract"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h3 className="font-semibold text-white">Audience</h3>
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>

      {hasSeverance && (
        <div className="mb-2 px-2 py-1 bg-red-900/30 border border-accent-red rounded text-xs text-red-200">
          ⚠️ Severance: Target age range exceeds contract
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Age Range</label>
          <div className="flex justify-between">
            <span className="text-gray-400">Contract:</span>
            <span className="text-white font-medium">{data?.contractAge || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Setup:</span>
            <span className={`font-medium ${status === 'FAIL' ? 'text-accent-red' : 'text-white'}`}>
              {data?.setupAge || 'N/A'}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block flex items-center space-x-1">
            <Heart className="w-3 h-3" aria-hidden="true" />
            <span>Interests</span>
          </label>
          <div className="text-white bg-dark-bg px-2 py-1 rounded">
            {data?.interests?.join(', ') || 'N/A'}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block flex items-center space-x-1">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            <span>Geographic</span>
          </label>
          <div className="text-white bg-dark-bg px-2 py-1 rounded">
            {data?.geos?.join(', ') || 'N/A'}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point"
      />
    </motion.div>
  );
};

export default AudienceNode;

