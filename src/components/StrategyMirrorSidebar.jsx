import React from 'react';
import { AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StrategyMirrorSidebar = ({ strategicGaps = [], onFixAll, isFixing }) => {
  const hasGaps = strategicGaps.length > 0;

  return (
    <aside
      className="w-80 bg-dark-surface border-l border-dark-border overflow-y-auto"
      aria-label="Strategy Mirror sidebar"
    >
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="w-5 h-5 text-accent-green" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Strategy Mirror</h2>
        </div>

        {/* Strategic Gap Summary */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Strategic Gap Analysis</h3>
          {hasGaps ? (
            <div className="space-y-2">
              {strategicGaps.map((gap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-900/20 border border-accent-red rounded-lg p-3"
                >
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-accent-red flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm text-red-100">{gap.message}</p>
                      {gap.remediation && (
                        <p className="text-xs text-red-200 mt-1">Remediation: {gap.remediation}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-green-900/20 border border-accent-green rounded-lg p-3"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-accent-green" aria-hidden="true" />
                <p className="text-sm text-green-100">No strategic gaps detected. Setup aligns with contract.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Fix All Button */}
        {hasGaps && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onFixAll}
            disabled={isFixing}
            className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface focus:ring-accent-green ${
              isFixing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-accent-green hover:bg-green-500 text-white'
            }`}
            aria-label="Fix all issues"
            aria-busy={isFixing}
          >
            {isFixing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Fixing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span>Fix All</span>
              </>
            )}
          </motion.button>
        )}

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-dark-border">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Gaps:</span>
              <span className={`font-semibold ${hasGaps ? 'text-accent-red' : 'text-accent-green'}`}>
                {strategicGaps.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-semibold ${hasGaps ? 'text-accent-red' : 'text-accent-green'}`}>
                {hasGaps ? 'Action Required' : 'Compliant'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default StrategyMirrorSidebar;

