import React, { memo } from 'react';

/**
 * Individual debug log entry component
 * Displays timestamp, message, and optional details
 */
const DebugLogEntry = ({ log }) => {
  const getLogTypeStyles = () => {
    switch (log.type) {
      case 'error':
        return 'bg-red-50 text-red-700';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700';
      case 'success':
        return 'bg-green-50 text-green-700';
      default:
        return 'bg-blue-50 text-blue-700';
    }
  };

  return (
    <div className={`mb-4 p-3 rounded-lg text-sm ${getLogTypeStyles()}`}>
      <div className="font-mono text-xs opacity-75 mb-1">
        {new Date(log.timestamp).toLocaleString()}
      </div>
      <div className="font-medium mb-1">{log.message}</div>
      {log.details && (
        <pre className="mt-2 p-2 bg-black/5 rounded overflow-x-auto">
          <code>{log.details}</code>
        </pre>
      )}
    </div>
  );
};

DebugLogEntry.displayName = 'DebugLogEntry';

export default memo(DebugLogEntry);