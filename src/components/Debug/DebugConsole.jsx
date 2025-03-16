import React, { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useDebug } from '@/contexts/DebugContext';

const DebugConsole = () => {
  const { logs, clearLogs } = useDebug();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Debug Information</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button
            variant="outline"
            onClick={clearLogs}
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear Logs
          </Button>
        </div>
      </div>
      <motion.div
        animate={{ height: isExpanded ? 'auto' : '300px' }}
        className="overflow-hidden"
      >
        <div className={`p-4 ${!isExpanded ? 'max-h-[300px] overflow-auto' : ''}`}>
          {logs.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No logs available
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg text-sm ${
                  log.type === 'error' ? 'bg-red-50 text-red-700' :
                  log.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  log.type === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
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
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

DebugConsole.displayName = 'DebugConsole';

export default memo(DebugConsole);