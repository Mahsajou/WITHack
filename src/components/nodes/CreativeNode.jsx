import React from 'react';
import { Handle, Position } from 'reactflow';
import { Image, Video, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import StatusIndicator from '../StatusIndicator';

const CreativeNode = ({ data, selected }) => {
  const status = data?.status || 'PASS';
  const talentRightsStatus = data?.talentRights || 'Active';

  const getBorderColor = () => {
    if (status === 'FAIL' || talentRightsStatus === 'Expired') return 'border-accent-red';
    if (status === 'WARN') return 'border-accent-amber';
    return 'border-accent-green';
  };

  const isImage = data?.type === 'image' || data?.url?.match(/\.(jpg|jpeg|png|gif|webp)/i);
  const isVideo = data?.type === 'video' || data?.url?.match(/\.(mp4|webm|mov)/i);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-dark-surface border-2 ${getBorderColor()} rounded-lg p-4 min-w-[220px] shadow-lg ${
        selected ? 'ring-2 ring-accent-green ring-offset-2 ring-offset-dark-bg' : ''
      }`}
      tabIndex={0}
      role="button"
      aria-label={`Creative node, status: ${status}, talent rights: ${talentRightsStatus}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-500"
        aria-label="Connection point from contract"
      />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isImage ? (
            <Image className="w-5 h-5 text-gray-400" aria-hidden="true" />
          ) : isVideo ? (
            <Video className="w-5 h-5 text-gray-400" aria-hidden="true" />
          ) : (
            <Image className="w-5 h-5 text-gray-400" aria-hidden="true" />
          )}
          <h3 className="font-semibold text-white">Creative</h3>
        </div>
        <StatusIndicator status={status} size="sm" />
      </div>

      {/* Thumbnail */}
      {data?.thumbnail && (
        <div className="mb-3 rounded overflow-hidden bg-dark-bg">
          <img
            src={data.thumbnail}
            alt={data?.alt || 'Creative thumbnail'}
            className="w-full h-24 object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Type</label>
          <div className="text-white bg-dark-bg px-2 py-1 rounded">
            {isImage ? 'Image' : isVideo ? 'Video' : 'Unknown'}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-1 block flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" aria-hidden="true" />
            <span>Talent Rights</span>
          </label>
          <div className={`px-2 py-1 rounded font-medium ${
            talentRightsStatus === 'Expired' || talentRightsStatus === 'Active'
              ? talentRightsStatus === 'Expired'
                ? 'bg-red-900/30 text-accent-red border border-accent-red'
                : 'bg-green-900/30 text-accent-green border border-accent-green'
              : 'bg-dark-bg text-white'
          }`}>
            {talentRightsStatus}
          </div>
        </div>

        {data?.metadata && (
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Metadata</label>
            <div className="text-xs text-gray-300 bg-dark-bg px-2 py-1 rounded">
              {Object.entries(data.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-400">{key}:</span>
                  <span className="text-white">{String(value)}</span>
                </div>
              ))}
            </div>
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

export default CreativeNode;

