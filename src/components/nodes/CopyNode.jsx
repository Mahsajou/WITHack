import React from 'react';
import { Handle, Position } from 'reactflow';
import { FileText, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusIndicator from '../StatusIndicator';

const CopyNode = ({ data, selected }) => {
  const status = data?.status || 'PASS';
  const violations = data?.violations || [];

  const getBorderColor = () => {
    if (status === 'FAIL' || violations.length > 0) return 'border-accent-red';
    if (status === 'WARN') return 'border-accent-amber';
    return 'border-accent-green';
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
      aria-label={`Copy node, status: ${status}, violations: ${violations.length}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point from contract"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h3 className="font-semibold text-white">Copy</h3>
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>

      {violations.length > 0 && (
        <div className="mb-2 px-2 py-1 bg-red-900/30 border border-accent-red rounded text-xs">
          <div className="flex items-center space-x-1 text-red-200 mb-1">
            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
            <span className="font-semibold">Compliance Violations</span>
          </div>
          <ul className="list-disc list-inside text-red-200 space-y-1">
            {violations.map((violation, idx) => (
              <li key={idx}>{violation}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Headline</label>
          <div className="text-white bg-dark-bg px-2 py-1 rounded line-clamp-2">
            {data?.headline || 'N/A'}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Body</label>
          <div className="text-white bg-dark-bg px-2 py-1 rounded line-clamp-3 text-xs">
            {data?.body || 'N/A'}
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

export default CopyNode;

