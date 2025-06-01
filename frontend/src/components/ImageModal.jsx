import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const ImageModal = ({ isOpen, onClose, imageUrl, imageData, senderName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setIsZoomed(false);
      setImageError(false);
    }
  }, [isOpen, imageUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${Date.now()}.${imageData?.format || 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div
      className="image-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div className="image-modal-content relative max-w-7xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium">
              {senderName ? `Image from ${senderName}` : 'Image'}
            </h3>
            {imageData && (
              <div className="text-sm text-gray-300">
                {imageData.width && imageData.height && (
                  <span>{imageData.width} × {imageData.height}</span>
                )}
                {imageData.bytes && (
                  <span className="ml-2">• {formatFileSize(imageData.bytes)}</span>
                )}
                {imageData.format && (
                  <span className="ml-2">• {imageData.format.toUpperCase()}</span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Toggle */}
            <button
              onClick={toggleZoom}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              title={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
              <ArrowsPointingOutIcon className="w-5 h-5" />
            </button>
            
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              title="Download image"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          )}
          
          {imageError ? (
            <div className="text-center text-white">
              <p className="text-lg mb-2">Failed to load image</p>
              <p className="text-sm text-gray-300">The image could not be displayed</p>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Full size image"
              className={`image-zoom-transition max-w-full max-h-full object-contain cursor-pointer ${
                isZoomed ? 'transform scale-150' : ''
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={toggleZoom}
              style={{ display: isLoading ? 'none' : 'block' }}
            />
          )}
        </div>

        {/* Footer with instructions */}
        <div className="p-4 bg-black bg-opacity-50 text-center text-sm text-gray-300">
          Click image to zoom • Press Esc to close • Click outside to close
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
