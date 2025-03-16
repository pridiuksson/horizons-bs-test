import { useState, useEffect } from 'react';
import { addDebugLog } from '@/lib/debug';

/**
 * Check for WebP support in the browser
 * @returns {boolean} Whether WebP is supported
 */
const checkWebPSupport = () => {
  return typeof window !== 'undefined' && 
         window.createImageBitmap !== undefined;
};

export const useImageLoader = (imageUrl) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setStatus('idle');
      return;
    }

    setStatus('loading');
    
    const img = new Image();
    
    img.onload = () => {
      setStatus('loaded');
      addDebugLog('Image loaded successfully', 'success', {
        url: imageUrl,
        size: `${img.naturalWidth}x${img.naturalHeight}`,
        type: img.currentSrc.split('.').pop(),
        webpEnabled: checkWebPSupport()
      });
    };

    img.onerror = (error) => {
      setError(error);
      setStatus('error');
      addDebugLog('Image failed to load', 'error', {
        url: imageUrl,
        error: error.message,
        webpEnabled: checkWebPSupport()
      });
    };

    // Add cache busting parameter and WebP support check
    const url = new URL(imageUrl);
    url.searchParams.set('t', Date.now());
    
    if (checkWebPSupport()) {
      url.searchParams.set('format', 'webp');
    }

    img.src = url.toString();

    return () => {
      img.src = '';
    };
  }, [imageUrl]);

  return { status, error };
};