import React from 'react';
import { FileText } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';

const ContractNode = ({ data }) => {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-dark-surface border-2 border-accent-green rounded-lg p-4 min-w-[200px] shadow-lg"
    >
      <div className="flex items-center space-x-2 mb-3">
        <FileText className="w-5 h-5 text-accent-green" aria-hidden="true" />
        <h3 className="font-semibold text-white">Master Contract</h3>
      </div>
      <div className="text-xs text-gray-400 mb-2">Source of Truth</div>
      <div className="space-y-1 text-sm">
        {data?.fields && Object.entries(data.fields).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-400">{key}:</span>
            <span className="text-white font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-accent-green"
        aria-label="Connection point to campaign fields"
      />
    </motion.div>
  );
};

export default ContractNode;

