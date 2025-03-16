import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ConnectionStatus = memo(({ isConnected }) => (
  <div className="flex items-center gap-2">
    {isConnected ? (
      <>
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span className="text-green-700">Connected</span>
      </>
    ) : (
      <>
        <XCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-700">Disconnected</span>
      </>
    )}
  </div>
));

const SupabasePanel = () => {
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [projectInfo, setProjectInfo] = useState({
    url: supabase.supabaseUrl,
    key: supabase.supabaseKey
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('dummy').select('*').limit(1);
        setConnectionStatus(!error);
      } catch {
        setConnectionStatus(false);
      }
    };

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };

    checkConnection();
    getUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Connection Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Database className="w-5 h-5" />
            Connection Status
          </h3>
          <ConnectionStatus isConnected={connectionStatus} />
        </div>
      </div>

      {/* Project Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Project Information</h3>
        <div className="space-y-2">
          <div>
            <label className="text-sm font-medium text-gray-500">Project URL:</label>
            <div className="mt-1 font-mono text-sm">{projectInfo.url}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">API Key:</label>
            <div className="mt-1 font-mono text-sm">
              {projectInfo.key.substring(0, 8)}...{projectInfo.key.substring(projectInfo.key.length - 8)}
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Authentication Status</h3>
        {currentUser ? (
          <div className="space-y-2">
            <div>
              <label className="text-sm font-medium text-gray-500">User ID:</label>
              <div className="mt-1 font-mono text-sm">{currentUser.id}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email:</label>
              <div className="mt-1 font-mono text-sm">{currentUser.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Sign In:</label>
              <div className="mt-1 font-mono text-sm">
                {new Date(currentUser.last_sign_in_at).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">No User Logged In</div>
        )}
      </div>
    </motion.div>
  );
};

ConnectionStatus.displayName = 'ConnectionStatus';
SupabasePanel.displayName = 'SupabasePanel';

export default memo(SupabasePanel);