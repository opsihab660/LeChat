import { useState, useRef } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const ImageUpload = ({ onImageSelect, onCancel, disabled = false, showInline = false }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        console.log('🖼️ Image uploaded successfully:', response.data);
        onImageSelect(response.data);
        // Reset state
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.error('❌ Upload failed:', response.data);
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onCancel();
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Inline preview component for input field
  if (showInline && selectedImage) {
    return (
      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
        <div className="flex-shrink-0">
          <img
            src={imagePreview}
            alt="Preview"
            className="w-12 h-12 object-cover rounded-lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {selectedImage.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isUploading ? 'Uploading...' : 'Ready to send'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isUploading}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Remove image"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="image-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!selectedImage ? (
        <button
          type="button"
          onClick={triggerFileSelect}
          disabled={disabled || isUploading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
          title="Upload image"
        >
          <PhotoIcon className="w-5 h-5" />
        </button>
      ) : (
        <div className="image-preview-container bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {selectedImage.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div className="flex-shrink-0 flex space-x-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded transition-colors"
              >
                {isUploading ? 'Uploading...' : 'Send'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Cancel"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
