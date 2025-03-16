import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, ChevronDown, ChevronUp, Clock, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NetworkRequest = memo(({ request }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-blue-500';
    if (status >= 400) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border rounded-lg mb-2 overflow-hidden"
    >
      <div
        className="p-3 bg-gray-50 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {request.isSupabase ? (
            <Database className="w-4 h-4 text-purple-500" />
          ) : (
            <Network className="w-4 h-4 text-blue-500" />
          )}
          <span className="font-medium">{request.url}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{request.method}</span>
          <span className={`text-sm ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-sm">{request.duration}ms</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Request Headers</h4>
              <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                <code>{JSON.stringify(request.requestHeaders, null, 2)}</code>
              </pre>
            </div>
            {request.requestBody && (
              <div>
                <h4 className="text-sm font-medium mb-2">Request Body</h4>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                  <code>{JSON.stringify(request.requestBody, null, 2)}</code>
                </pre>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium mb-2">Response Headers</h4>
              <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                <code>{JSON.stringify(request.responseHeaders, null, 2)}</code>
              </pre>
            </div>
            {request.responseBody && (
              <div>
                <h4 className="text-sm font-medium mb-2">Response Body</h4>
                <pre className="bg-gray-50 p-2 rounded text-sm overflow-x-auto">
                  <code>{JSON.stringify(request.responseBody, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
});

const NetworkPanel = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Subscribe to network requests
    const handleRequest = (request) => {
      setRequests(prev => [request, ...prev]);
    };

    if (window.networkSubscribers) {
      window.networkSubscribers.add(handleRequest);
    }

    return () => {
      if (window.networkSubscribers) {
        window.networkSubscribers.delete(handleRequest);
      }
    };
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filter === 'supabase') return request.isSupabase;
    if (filter === 'other') return !request.isSupabase;
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'supabase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('supabase')}
        >
          Supabase
        </Button>
        <Button
          variant={filter === 'other' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('other')}
        >
          Other
        </Button>
      </div>

      <div className="space-y-2">
        {filteredRequests.map((request, index) => (
          <NetworkRequest key={index} request={request} />
        ))}
      </div>
    </div>
  );
};

NetworkRequest.displayName = 'NetworkRequest';
NetworkPanel.displayName = 'NetworkPanel';

export default memo(NetworkPanel);