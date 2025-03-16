import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const ErrorEntry = memo(({ error }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="font-medium text-red-700">{error.message}</div>
            <div className="text-xs text-red-500">
              {new Date(error.timestamp).toLocaleString()}
            </div>
          </div>
          {error.details && (
            <pre className="mt-2 p-2 bg-white/50 rounded text-sm overflow-x-auto text-red-600">
              <code>{error.details}</code>
            </pre>
          )}
          {error.stack && (
            <div className="mt-2">
              <div className="text-sm font-medium text-red-700 mb-1">Stack Trace:</div>
              <pre className="p-2 bg-white/50 rounded text-sm overflow-x-auto text-red-600">
                <code>{error.stack}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const ErrorPanel = ({ logs }) => {
  return (
    <div>
      {logs.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No errors logged
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log, index) => (
            <ErrorEntry key={index} error={log} />
          ))}
        </div>
      )}
    </div>
  );
};

ErrorEntry.displayName = 'ErrorEntry';
ErrorPanel.displayName = 'ErrorPanel';

export default memo(ErrorPanel);