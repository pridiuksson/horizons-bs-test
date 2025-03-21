import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lququtvgfdvplhkselfh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdXF1dHZnZmR2cGxoa3NlbGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjEzMTEsImV4cCI6MjA1NzU5NzMxMX0.kruLD0RXU1xj2uMeRXrcKF7HMGwpQRM3FpIDYK40180';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const STORAGE_BUCKET = 'nine-picture-grid-images';

export const uploadImageWithPermissions = async (bucketName, filePath, file, addDebugLog) => {
  try {
    // First, verify current session with detailed logging
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      addDebugLog('Error getting session for upload', 'error', {
        error: sessionError.message,
        fullError: JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError), 2)
      });
      throw sessionError;
    }

    if (!session) {
      addDebugLog('No active session found for upload', 'error');
      throw new Error('Authentication required for upload');
    }

    // Log detailed session information
    addDebugLog('User authentication verified for upload', 'info', {
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      sessionId: session.access_token,
      aud: session.user.aud,
      authenticatedAt: new Date(session.user.confirmed_at).toISOString()
    });

    // Prepare upload options with minimal returns
    const uploadOptions = {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
      duplex: 'half',
      returning: 'minimal',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'x-upsert': 'true'
      }
    };

    // Log complete upload parameters
    addDebugLog('Preparing storage upload with parameters', 'info', {
      bucket: bucketName,
      filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadOptions: JSON.stringify(uploadOptions, null, 2),
      userContext: {
        userId: session.user.id,
        role: session.user.role
      }
    });

    // Attempt upload with explicit options
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, uploadOptions);

    if (uploadError) {
      addDebugLog('Upload failed with permissions', 'error', {
        error: uploadError.message,
        code: uploadError.code,
        details: uploadError.details,
        hint: uploadError.hint,
        status: uploadError.status,
        statusText: uploadError.statusText,
        requestId: uploadError.requestId,
        fullError: JSON.stringify(uploadError, Object.getOwnPropertyNames(uploadError), 2)
      });
      throw uploadError;
    }

    addDebugLog('Upload successful with permissions', 'success', {
      path: filePath,
      userId: session.user.id,
      uploadResponse: JSON.stringify(data, null, 2)
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error in uploadImageWithPermissions:', error);
    addDebugLog('Upload with permissions failed', 'error', {
      error: error.message,
      name: error.name,
      code: error.code,
      details: error.details,
      hint: error.hint,
      status: error.status,
      statusText: error.statusText,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    return { data: null, error };
  }
};

export const initializeStorage = async (addDebugLog) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      addDebugLog('Error getting session for storage initialization', 'error', {
        error: sessionError.message,
        fullError: JSON.stringify(sessionError, Object.getOwnPropertyNames(sessionError), 2)
      });
      throw sessionError;
    }

    if (!session) {
      addDebugLog('No authenticated session found', 'warning');
      return false;
    }

    addDebugLog('Verifying storage access...', 'info', {
      userId: session.user.id,
      role: session.user.role,
      bucket: STORAGE_BUCKET,
      sessionId: session.access_token,
      authenticatedAt: new Date(session.user.confirmed_at).toISOString()
    });

    // Verify bucket access with auth headers
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

    if (listError) {
      addDebugLog('Error accessing storage bucket', 'error', {
        error: listError.message,
        fullError: JSON.stringify(listError, Object.getOwnPropertyNames(listError), 2)
      });
      throw listError;
    }

    addDebugLog('Storage access verified successfully', 'success', {
      fileCount: files?.length || 0,
      bucket: STORAGE_BUCKET,
      userId: session.user.id,
      role: session.user.role
    });

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    addDebugLog('Storage initialization failed', 'error', {
      error: error.message,
      stack: error.stack,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    throw error;
  }
};