import React from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

const PushToLiveButton = ({ complianceScore, onPush }) => {
  const isDisabled = complianceScore < 100;

  return (
    <motion.button
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onPush}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg ${
        isDisabled
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-accent-green hover:bg-green-500 text-white focus:ring-accent-green'
      }`}
      aria-label={
        isDisabled
          ? `Push to Live disabled. Compliance score is ${complianceScore}, needs to be 100`
          : 'Push to Live - Deploy campaign to production'
      }
    >
      <Send className="w-5 h-5" aria-hidden="true" />
      <span>Push to Live</span>
    </motion.button>
  );
};

export default PushToLiveButton;

