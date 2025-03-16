import { supabase } from './supabase';
import { addDebugLog } from './debug';

export const signIn = async (email, password) => {
  try {
    addDebugLog('Attempting to sign in', 'info', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Validate response data
    if (!data || !data.user) {
      throw new Error('Invalid response from authentication service');
    }

    addDebugLog('Sign in successful', 'success', {
      userId: data.user.id,
      email: data.user.email
    });

    return { data, error: null };
  } catch (error) {
    addDebugLog('Sign in failed', 'error', {
      error: error.message,
      details: error
    });
    return { data: null, error };
  }
};

export const signUp = async (email, password) => {
  try {
    addDebugLog('Attempting to sign up', 'info', { email });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // Validate response data
    if (!data) {
      throw new Error('Invalid response from authentication service');
    }

    // Check if user object exists
    if (!data.user) {
      throw new Error('User data not received from authentication service');
    }

    addDebugLog('Sign up successful', 'success', {
      userId: data.user.id,
      email: data.user.email,
      confirmationRequired: data.session === null
    });

    return { data, error: null };
  } catch (error) {
    addDebugLog('Sign up failed', 'error', {
      error: error.message,
      details: error
    });
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    addDebugLog('Attempting to sign out', 'info');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    addDebugLog('Sign out successful', 'success');
    return { error: null };
  } catch (error) {
    addDebugLog('Sign out failed', 'error', {
      error: error.message,
      details: error
    });
    return { error };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;

    // Validate session data
    if (!data) {
      throw new Error('Invalid response while getting session');
    }

    // Check if session exists
    const session = data.session;
    if (!session) {
      addDebugLog('No active session found', 'info');
      return { session: null, error: null };
    }

    // Validate user data in session
    if (!session.user) {
      throw new Error('Invalid session: missing user data');
    }

    addDebugLog('Retrieved current session', 'success', {
      userId: session.user.id,
      email: session.user.email
    });

    return { session, error: null };
  } catch (error) {
    addDebugLog('Failed to get current session', 'error', {
      error: error.message,
      details: error
    });
    return { session: null, error };
  }
};

export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;

    // Validate response data
    if (!data) {
      throw new Error('Invalid response while refreshing session');
    }

    // Check if session exists
    const { session } = data;
    if (!session) {
      addDebugLog('No session to refresh', 'info');
      return { session: null, error: null };
    }

    // Validate user data in refreshed session
    if (!session.user) {
      throw new Error('Invalid refreshed session: missing user data');
    }

    addDebugLog('Session refreshed successfully', 'success', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: new Date(session.expires_at).toISOString()
    });

    return { session, error: null };
  } catch (error) {
    addDebugLog('Failed to refresh session', 'error', {
      error: error.message,
      details: error
    });
    return { session: null, error };
  }
};