import { MAX_DEBUG_LOGS } from './constants';

export const addDebugLog = (message, type = 'info', details = null) => {
  // Use the globally exposed addLog function from DebugContext
  if (typeof window !== 'undefined' && window._debugAddLog) {
    window._debugAddLog(message, type, details);
  }
  // Also log to console for development
  console.log(`[${type.toUpperCase()}] ${message}`, details || '');
};

export const initializeDebugSystem = () => {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = Math.round(performance.now() - start);
        
        addDebugLog('Network request completed', 'info', {
          url: args[0],
          method: args[1]?.method || 'GET',
          duration,
          status: response.status,
          timestamp: new Date().toISOString(),
          isSupabase: args[0].includes('supabase')
        });

        return response;
      } catch (error) {
        const duration = Math.round(performance.now() - start);
        
        addDebugLog('Network request failed', 'error', {
          url: args[0],
          method: args[1]?.method || 'GET',
          duration,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        throw error;
      }
    };
  }
};

export const measurePerformance = (label, fn) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    addDebugLog(`Performance: ${label}`, 'info', {
      duration: `${duration.toFixed(2)}ms`
    });
    
    return result;
  }
  return fn();
};