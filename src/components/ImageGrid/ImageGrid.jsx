import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImageGrid = ({
  images,
  onUpload,
  onRemove,
  onInteraction,
  isLoading
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-3 gap-4 mb-8"
    >
      {images.map((image, index) => (
        <motion.div
          key={`grid-${index}`}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white"
        >
          {image ? (
            <div className="relative h-full group">
              <img
                src={image}
                alt={`Grid item ${index + 1}`}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => onInteraction(index)}
                draggable="false"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add Image</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => onUpload(index, e)}
                disabled={isLoading}
              />
            </label>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
};

ImageGrid.displayName = 'ImageGrid';

export default memo(ImageGrid);