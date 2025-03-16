import { supabase } from './supabase';
import { STORAGE_BUCKET } from './constants';
import { addDebugLog } from './debug';
import { checkWebPSupport } from './utils';

/**
 * Generate optimized image URL with proper format support
 * @param {string} url - Original image URL
 * @returns {Promise<string>} Optimized URL with appropriate format
 */
export const generateOptimizedImageUrl = async (url) => {
  try {
    const imageUrl = new URL(url);
    const webpSupported = await checkWebPSupport();
    
    // Add cache control parameters
    imageUrl.searchParams.set('cache', 'max-age=31536000,immutable');
    
    // Add format parameter if WebP is supported
    if (webpSupported) {
      imageUrl.searchParams.set('format', 'webp');
      addDebugLog('Using WebP format for image', 'info');
    } else {
      addDebugLog('WebP not supported, using original format', 'info');
    }
    
    // Add quality parameter for optimization
    imageUrl.searchParams.set('quality', '80');
    
    // Add cache busting parameter
    imageUrl.searchParams.set('t', Date.now());
    
    return imageUrl.toString();
  } catch (error) {
    addDebugLog('Error generating optimized URL', 'error', { error });
    return url;
  }
};

/**
 * Get public URL for an image with format optimization
 * @param {string} filePath - Path of the file in storage
 * @returns {Promise<{url: string, error: Error}>}
 */
export const getImageUrl = async (filePath) => {
  try {
    addDebugLog(`Getting public URL for ${filePath}`, 'info');

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (error) throw error;

    // Generate optimized URL with proper format support
    const optimizedUrl = await generateOptimizedImageUrl(data.publicUrl);
    
    addDebugLog('Generated optimized URL', 'success', {
      originalUrl: data.publicUrl,
      optimizedUrl
    });

    return { url: optimizedUrl, error: null };
  } catch (error) {
    addDebugLog('Failed to get image URL', 'error', {
      error: error.message,
      filePath
    });
    return { url: null, error };
  }
};

/**
 * Upload an image with optimization
 * @param {string} filePath - Path where to store the file
 * @param {File} file - File to upload
 * @returns {Promise<{data: Object, error: Error}>}
 */
export const uploadImage = async (filePath, file) => {
  try {
    // Verify current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      addDebugLog('Session verification failed', 'error', {
        error: sessionError.message
      });
      throw sessionError;
    }

    if (!session) {
      addDebugLog('No active session found', 'error');
      throw new Error('Authentication required');
    }

    // Log upload attempt
    addDebugLog('Initiating file upload with optimization', 'info', {
      filePath,
      userId: session.user.id
    });

    // Prepare upload options with proper cache control
    const uploadOptions = {
      cacheControl: 'max-age=31536000, public, immutable',
      upsert: true,
      contentType: file.type,
      duplex: 'half',
      returning: 'minimal',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    };

    // Attempt upload
    const { data, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, uploadOptions);

    if (uploadError) {
      addDebugLog('Upload failed', 'error', {
        error: uploadError.message,
        details: uploadError
      });
      throw uploadError;
    }

    // Get optimized URL
    const { url: publicUrl, error: urlError } = await getImageUrl(filePath);
    if (urlError) throw urlError;

    addDebugLog('Upload successful with optimization', 'success', {
      filePath,
      publicUrl
    });

    return { data: { ...data, publicUrl }, error: null };
  } catch (error) {
    addDebugLog('Upload process failed', 'error', {
      error: error.message,
      stack: error.stack
    });
    return { data: null, error };
  }
};

/**
 * Remove an image
 * @param {string} filePath - Path of the file to remove
 * @returns {Promise<{error: Error}>}
 */
export const removeImage = async (filePath) => {
  try {
    addDebugLog(`Removing file: ${filePath}`, 'info');

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) throw error;

    addDebugLog('File removed successfully', 'success', { filePath });
    return { error: null };
  } catch (error) {
    addDebugLog('File removal failed', 'error', {
      error: error.message,
      filePath
    });
    return { error };
  }
};