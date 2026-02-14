import React from 'react';
import { Handle, Position } from 'reactflow';
import { Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusIndicator from '../StatusIndicator';

const TemporalNode = ({ data, selected }) => {
  const status = data?.status || 'PASS';

  const getBorderColor = () => {
    if (status === 'FAIL') return 'border-accent-red';
    if (status === 'WARN') return 'border-accent-amber';
    return 'border-accent-green';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-dark-surface border-2 ${getBorderColor()} rounded-lg p-4 min-w-[220px] shadow-lg ${
        selected ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-dark-bg' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Temporal node, status: ${status}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point from contract"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h3 className="font-semibold text-white">Temporal</h3>
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>

      {/* Mini Timeline */}
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-xs text-gray-400 mb-2 block flex items-center space-x-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>Timeline</span>
          </label>
          
          {/* Contract Dates */}
          <div className="mb-2">
            <div className="text-xs text-gray-400 mb-1">Contract</div>
            <div className="bg-dark-bg px-2 py-1 rounded border-l-2 border-accent-green">
              <div className="text-white text-xs">
                <div>Start: {formatDate(data?.contractStart)}</div>
                <div>End: {formatDate(data?.contractEnd)}</div>
              </div>
            </div>
          </div>

          {/* Setup Dates */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Setup</div>
            <div className={`bg-dark-bg px-2 py-1 rounded border-l-2 ${
              status === 'FAIL' ? 'border-accent-red' : 'border-accent-green'
            }`}>
              <div className={`text-xs ${
                status === 'FAIL' ? 'text-accent-red' : 'text-white'
              }`}>
                <div>Start: {formatDate(data?.setupStart)}</div>
                <div>End: {formatDate(data?.setupEnd)}</div>
              </div>
            </div>
          </div>
        </div>

        {status === 'FAIL' && (
          <div className="px-2 py-1 bg-red-900/30 border border-accent-red rounded text-xs text-red-200">
            ⚠️ Date mismatch: Setup dates outside contract window
          </div>
        )}
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

export default TemporalNode;

