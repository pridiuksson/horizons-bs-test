import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { MAX_DEBUG_LOGS } from '@/lib/constants';

const DebugContext = createContext(null);

const debugReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_LOG':
      return {
        ...state,
        logs: [action.payload, ...state.logs].slice(0, MAX_DEBUG_LOGS)
      };
    case 'CLEAR_LOGS':
      return {
        ...state,
        logs: []
      };
    default:
      return state;
  }
};

export const DebugProvider = ({ children }) => {
  const [state, dispatch] = useReducer(debugReducer, {
    logs: []
  });

  const addLog = useCallback((message, type = 'info', details = null) => {
    const timestamp = new Date().toISOString();
    dispatch({
      type: 'ADD_LOG',
      payload: {
        timestamp,
        message,
        type,
        details: details ? JSON.stringify(details, null, 2) : null
      }
    });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
  }, []);

  // Expose addLog function globally for debug.js
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window._debugAddLog = addLog;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window._debugAddLog;
      }
    };
  }, [addLog]);

  return (
    <DebugContext.Provider
      value={{
        logs: state.logs,
        addLog,
        clearLogs
      }}
    >
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};