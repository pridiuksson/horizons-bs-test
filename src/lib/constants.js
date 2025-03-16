// Application-wide constants
export const STORAGE_BUCKET = 'nine-picture-grid-images';
export const GRID_SIZE = 9;
export const MAX_DEBUG_LOGS = 1000;
export const DESCRIPTION_DEBOUNCE_MS = 500;
export const IMAGE_UPLOAD_OPTIONS = {
  cacheControl: 'max-age=31536000, public, immutable',
  upsert: true,
  returning: 'minimal'
};