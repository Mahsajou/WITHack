import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AuditSidebar = ({ flags = [], onRemediate }) => {
  const getFlagIcon = (status) => {
    switch (status) {
      case 'FAIL':
        return <AlertCircle className="w-5 h-5" aria-hidden="true" />;
      case 'WARN':
        return <AlertTriangle className="w-5 h-5" aria-hidden="true" />;
      case 'PASS':
        return <CheckCircle2 className="w-5 h-5" aria-hidden="true" />;
      default:
        return null;
    }
  };

  const getFlagStyles = (status) => {
    switch (status) {
      case 'FAIL':
        return {
          bg: 'bg-red-900/20',
          border: 'border-accent-red',
          text: 'text-red-100',
          iconColor: 'text-accent-red',
          button: 'bg-accent-red hover:bg-red-600 text-white',
        };
      case 'WARN':
        return {
          bg: 'bg-amber-900/20',
          border: 'border-accent-amber',
          text: 'text-amber-100',
          iconColor: 'text-accent-amber',
          button: 'bg-accent-amber hover:bg-amber-600 text-gray-900',
        };
      case 'PASS':
        return {
          bg: 'bg-green-900/20',
          border: 'border-accent-green',
          text: 'text-green-100',
          iconColor: 'text-accent-green',
          button: null,
        };
      default:
        return {};
    }
  };

  return (
    <aside
      className="w-80 bg-dark-surface border-r border-dark-border overflow-y-auto"
      aria-label="Audit flags sidebar"
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-white">Audit Flags</h2>
        <div
          className="space-y-3"
          role="list"
          aria-live="polite"
          aria-atomic="false"
        >
          <AnimatePresence>
            {flags.map((flag) => {
              const styles = getFlagStyles(flag.status);
              return (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  role="listitem"
                  className={`${styles.bg} ${styles.border} border rounded-lg p-4`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
                      {getFlagIcon(flag.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`text-sm font-semibold ${styles.text}`}
                          aria-label={`Status: ${flag.status}`}
                        >
                          {flag.status}
                        </span>
                      </div>
                      <p className={`text-sm ${styles.text} mb-2`}>
                        {flag.message}
                      </p>
                      {flag.field && (
                        <p className="text-xs text-gray-400 mb-2">
                          Field: {flag.field}
                        </p>
                      )}
                      {flag.status === 'FAIL' && (
                        <button
                          onClick={() => onRemediate(flag)}
                          className={`${styles.button} px-3 py-1.5 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-surface focus:ring-accent-red flex items-center space-x-1`}
                          aria-label={`Remediate issue: ${flag.message}`}
                        >
                          <Wrench className="w-4 h-4" aria-hidden="true" />
                          <span>Remediate</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {flags.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No audit flags found</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AuditSidebar;

