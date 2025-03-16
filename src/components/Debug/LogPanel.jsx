import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Info, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

const LogEntry = memo(({ log }) => {
  const getLogIcon = () => {
    switch (log.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLogTypeStyles = () => {
    switch (log.type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 p-3 rounded-lg border ${getLogTypeStyles()}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1">{getLogIcon()}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="font-medium">{log.message}</div>
            <div className="text-xs text-gray-500">
              {new Date(log.timestamp).toLocaleString()}
            </div>
          </div>
          {log.details && (
            <pre className="mt-2 p-2 bg-white/50 rounded text-sm overflow-x-auto">
              <code>{log.details}</code>
            </pre>
          )}
        </div>
      </div>
    </motion.div>
  );
});

const LogPanel = ({ logs }) => {
  return (
    <div className="space-y-2">
      {logs.map((log, index) => (
        <LogEntry key={index} log={log} />
      ))}
    </div>
  );
};

LogEntry.displayName = 'LogEntry';
LogPanel.displayName = 'LogPanel';

export default memo(LogPanel);