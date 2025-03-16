import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Memoized className merger
const memoizedMerge = (() => {
  const cache = new Map();
  return (...inputs) => {
    const key = inputs.join('|');
    if (!cache.has(key)) {
      cache.set(key, twMerge(clsx(inputs)));
    }
    return cache.get(key);
  };
})();

export const cn = memoizedMerge;

// Reliable WebP support detection
export const checkWebPSupport = async () => {
  if (typeof window === 'undefined') return false;
  
  // Check if we already tested WebP support
  if (typeof window._webpSupport !== 'undefined') {
    return window._webpSupport;
  }

  // Create test image
  const webP = new Image();
  
  // Create a Promise to handle the async check
  const support = new Promise((resolve) => {
    webP.onload = () => {
      const result = webP.width > 0 && webP.height > 0;
      window._webpSupport = result; // Cache the result
      resolve(result);
    };
    
    webP.onerror = () => {
      window._webpSupport = false; // Cache the result
      resolve(false);
    };
  });

  // Smallest possible WebP image
  webP.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';

  return support;
};

// Debounce utility
export const debounce = (fn, ms = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), ms);
  };
};

// Throttle utility
export const throttle = (fn, ms = 300) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      fn.apply(null, args);
      lastCall = now;
    }
  };
};

// Image loader utility with WebP support
export const loadImage = async (src) => {
  const webpSupported = await checkWebPSupport();
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    
    // Add WebP parameter if supported
    const url = new URL(src, window.location.href);
    if (webpSupported) {
      url.searchParams.set('format', 'webp');
    }
    img.src = url.toString();
  });
};

// Local storage with error handling
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
      return false;
    }
  }
};

// Performance monitoring utility
export const measurePerformance = (label, fn) => {
  if (process.env.NODE_ENV === 'development') {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  }
  return fn();
};